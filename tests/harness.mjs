// Loads "pure" (DOM-free) blocks out of grow-log.html so they can be tested in Node.
// A block is delimited by `// @pure:begin NAME` / `// @pure:end NAME` and lists what it
// offers on one line: `// @exports a, b`.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HTML = join(dirname(fileURLToPath(import.meta.url)), "..", "grow-log.html");

export function loadPure(names) {
  const html = readFileSync(HTML, "utf8").split("\r\n").join("\n");
  let code = "";
  const exported = [];
  for (const name of names) {
    const begin = html.indexOf(`// @pure:begin ${name}\n`);
    const end = html.indexOf(`// @pure:end ${name}`);
    if (begin < 0 || end < begin) throw new Error(`pure block "${name}" not found in grow-log.html`);
    const body = html.slice(begin, end);
    const match = body.match(/\/\/ @exports ([^\n]+)/);
    if (match) exported.push(...match[1].split(",").map((item) => item.trim()).filter(Boolean));
    code += `${body}\n`;
  }
  code += `\n;globalThis.__out = { ${exported.join(", ")} };`;
  const context = vm.createContext({});
  vm.runInContext(code, context, { filename: "grow-log.html (pure)" });
  return context.__out;
}
