// PHONE=320x568 node tests/dom.mjs tests/dom/phone-celebrate.js
// The unlock celebration fits a tiny phone and its Collect button can be reached.
async function scenario(h) {
  const vw = window.innerWidth, vh = window.innerHeight;
  window.confirm = () => true;
  h.click(h.$("[data-load-sample]"));
  await h.sleep(800);
  // close any celebrations the sample triggers
  for (let i = 0; i < 10; i += 1) { const d = h.$("#celebrate-dialog"); if (d && d.open) { d.close(); await h.sleep(400); } }
  location.hash = "trophies"; await h.sleep(400);
  const earned = h.$(".trophy-card.unlocked");
  h.check("sample has an unlocked trophy", !!earned);
  h.click(earned.querySelector("button") || earned);
  await h.until(() => h.$("#trophy-detail").open, 2000);
  h.click(h.$$("#trophy-detail button").find((b) => /Replay unlock/.test(b.textContent)));
  h.check("celebration opens", await h.until(() => h.$("#celebrate-dialog") && h.$("#celebrate-dialog").open, 3000));
  await h.sleep(1400);
  const d = h.$("#celebrate-dialog"), r = d.getBoundingClientRect();
  h.check("celebration fits the screen", r.left >= -1 && r.right <= vw + 1 && r.top >= -1 && r.bottom <= vh + 1, `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.right.toFixed(0)}x${r.bottom.toFixed(0)} of ${vw}x${vh}`);
  const btn = h.$("#celebrate-collect"); btn.scrollIntoView({ block: "nearest" }); await h.sleep(60);
  const b = btn.getBoundingClientRect();
  h.check("Collect button reachable and at least 44px tall", b.top >= 0 && b.bottom <= vh && b.height >= 44, `${b.top.toFixed(0)}-${b.bottom.toFixed(0)} h${b.height.toFixed(0)}`);
  h.check("no sideways scroll on the page", document.documentElement.scrollWidth <= vw + 1, String(document.documentElement.scrollWidth));
}
