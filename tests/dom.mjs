// Runs a scripted UI scenario in headless Chrome (via DevTools protocol, real time) against a temp copy of grow-log.html.
// Usage: node tests/dom.mjs tests/dom/<scenario>.js [query]
// The scenario defines `async function scenario(h)` and uses h.check(name, cond) / h.$ / h.click / h.sleep / h.fill / h.submit.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scenarioFile = resolve(process.argv[2]);
const query = process.argv[3] || "";
const html = readFileSync(process.env.HTML_SRC || join(root, "grow-log.html"), "utf8");
const helpers = `
window.__results = [];
const h = {
  $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => [...r.querySelectorAll(s)],
  sleep: (ms) => new Promise((res) => setTimeout(res, ms)),
  until: async (fn, ms = 4000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await fn()) return true; } catch (e) {} await new Promise((r) => setTimeout(r, 40)); } return false; },
  check: (name, ok, detail) => window.__results.push((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " :: " + (detail ?? ""))),
  click: (el) => { if (!el) throw new Error("click target missing"); el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); },
  fill: (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); },
  submit: (form) => form.requestSubmit(),
  errors: []
};
window.addEventListener("error", (e) => h.errors.push(String(e.message)));
window.addEventListener("unhandledrejection", (e) => h.errors.push(String(e.reason)));
`;
const runner = `
(async () => {
  try { await scenario(h); } catch (e) { window.__results.push("FAIL scenario threw :: " + (e && e.stack || e)); }
  if (h.errors.length) window.__results.push("FAIL page errors :: " + h.errors.join(" | "));
  const pre = document.createElement("pre"); pre.id = "__r"; pre.textContent = window.__results.join("\\n");
  document.body.append(pre);
})();`;
const scenario = readFileSync(scenarioFile, "utf8");
const injected = `<script>${helpers}\n${scenario}\n${runner}</script>`;
const tmpDir = join(root, ".superpowers");
mkdirSync(tmpDir, { recursive: true });
const tmp = join(tmpDir, "dom-run.html");
writeFileSync(tmp, html.replace("</body>", () => injected + "</body>"));
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const userData = join(tmpDir, "chrome-profile-" + Date.now());
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", `--user-data-dir=${userData}`, `--remote-debugging-port=${port}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let result = "";
try {
  let target;
  for (let i = 0; i < 60 && !target; i += 1) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch (e) { /* not up yet */ }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("Chrome did not start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (event) => { const msg = JSON.parse(event.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
  const send = (method, params = {}) => new Promise((res) => { id += 1; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: pathToFileURL(tmp).href + query });
  const end = Date.now() + Number(process.env.DOM_TIMEOUT || 40000);
  while (Date.now() < end) {
    const r = await send("Runtime.evaluate", { expression: "(document.getElementById('__r')||{}).textContent", returnByValue: true });
    if (r.result && r.result.result && typeof r.result.result.value === "string") { result = r.result.result.value; break; }
    await sleep(300);
  }
  if (process.env.SHOT) {
    await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(400);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(process.env.SHOT, Buffer.from(shot.result.data, "base64"));
  }
  ws.close();
} finally {
  proc.kill();
}
if (!result) { console.log("NO RESULT (scenario did not finish)"); process.exit(1); }
const lines = result.split("\n").filter(Boolean);
lines.forEach((line) => console.log(line));
const failed = lines.filter((line) => line.startsWith("FAIL")).length;
console.log(`\n${lines.length - failed}/${lines.length} dom checks passed`);
process.exit(failed ? 1 : 0);
