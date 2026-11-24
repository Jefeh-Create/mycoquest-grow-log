import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
globalThis.__tests = [];
globalThis.test = (name, fn) => globalThis.__tests.push([name, fn]);

for (const file of readdirSync(here).filter((name) => name.endsWith(".test.mjs")).sort()) {
  await import(pathToFileURL(join(here, file)).href);
}
let failed = 0;
for (const [name, fn] of globalThis.__tests) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { failed += 1; console.log(`FAIL ${name}\n     ${error && error.message}`); }
}
console.log(`\n${globalThis.__tests.length - failed}/${globalThis.__tests.length} passed`);
process.exit(failed ? 1 : 0);
