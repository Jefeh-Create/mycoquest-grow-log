// Checks the MycoQuest Grow Log translation files. Run from the repository root:
//   node tools/check-translations.mjs
// Reports, for every language file in i18n/:
//   - keys missing compared with English (the source), and keys English doesn't have
//   - {placeholders} that differ from English, and plural entries missing a form
//   - keys the pages use that English doesn't define (static uses only; dynamic keys are
//     checked when the pages run, which warn in the console about any missing text)
// Exits with code 1 if an enabled language has a problem. Disabled languages are reported only.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "i18n");
const sandbox = { window: {} };
vm.createContext(sandbox);
const files = readdirSync(dir).filter((name) => name.endsWith(".js") && name !== "i18n.js");
// English first, because other files may extend it.
files.sort((a, b) => (a === "en.js" ? -1 : b === "en.js" ? 1 : a.localeCompare(b)));
for (const name of files) vm.runInContext(readFileSync(join(dir, name), "utf8"), sandbox, { filename: name });

const locales = sandbox.window.MQ_LOCALES;
const english = locales.en.strings;
const placeholders = (value) => [...new Set(JSON.stringify(value).match(/\{\w+\}/g) || [])].sort().join(" ");
let failed = false;

for (const [code, locale] of Object.entries(locales)) {
  if (code === "en") continue;
  const problems = [];
  const strings = locale.strings;
  for (const key of Object.keys(english)) {
    const value = strings[key];
    if (value === undefined || (value === "" && english[key] !== "")) { problems.push(`missing: ${key}`); continue; }
    if (placeholders(value) !== placeholders(english[key])) problems.push(`placeholders differ: ${key}`);
    if (typeof english[key] === "object" && (typeof value !== "object" || !value.other)) problems.push(`plural needs an "other" form: ${key}`);
  }
  for (const key of Object.keys(strings)) if (!(key in english)) problems.push(`not in English: ${key}`);
  const total = Object.keys(english).length;
  const done = Object.keys(english).filter((key) => strings[key] !== undefined && (strings[key] !== "" || english[key] === "")).length;
  const state = locale.meta.enabled ? "enabled" : "not enabled";
  console.log(`${code} (${locale.meta.name}, ${state}): ${done} of ${total} strings. ${locale.meta.status || ""}`);
  if (locale.meta.review?.length) console.log(`  ${locale.meta.review.length} lines flagged for expert or fluent-speaker review (see meta.review).`);
  if (locale.meta.enabled) {
    problems.forEach((problem) => console.log(`  ${problem}`));
    if (problems.length) failed = true;
  } else if (problems.length) {
    console.log(`  ${problems.length} items to do before it can be enabled.`);
  }
}

// Static key uses in the pages.
const used = new Set();
for (const page of ["grow-log.html"]) {
  const html = readFileSync(join(root, page), "utf8");
  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(match[1]);
  for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) match[1].split(";").forEach((pair) => pair.includes(":") && used.add(pair.split(":")[1].trim()));
  for (const match of html.matchAll(/\bt\(\s*"([\w.-]+)"/g)) used.add(match[1]);
}
// Keys built at run time, such as t("stage." + name), show up here as prefixes ending in "."; skip them.
const undefinedKeys = [...used].filter((key) => !key.endsWith(".") && !(key in english));
if (undefinedKeys.length) {
  failed = true;
  console.log("Keys used by the pages but missing from en.js:");
  undefinedKeys.forEach((key) => console.log(`  ${key}`));
}
console.log(failed ? "Translation check FAILED." : "Translation check passed.");
process.exit(failed ? 1 : 0);
