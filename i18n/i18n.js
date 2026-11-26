// MycoQuest translation runtime for the grow log (same runtime as the MycoQuest shop).
// Strings live in i18n/<code>.js files. English (en.js) is the source and the fallback.
// See i18n/README.md for how to add a language.
(() => {
  "use strict";
  const STORAGE_KEY = "mycoquest-language"; // Separate from every saved record; holds only a language code.
  const locales = window.MQ_LOCALES || {};
  const source = locales.en;
  if (!source) throw new Error("i18n/en.js must load before i18n/i18n.js");
  const enabled = Object.keys(locales).filter((code) => locales[code].meta && locales[code].meta.enabled);
  const reported = new Set();
  let code = "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (enabled.includes(saved)) code = saved;
  } catch (error) {
    // Storage blocked: the choice lasts for this page view only.
  }

  const meta = () => locales[code].meta;
  const locale = () => meta().htmlLang;
  let rules = new Intl.PluralRules(locale());

  function report(message) {
    if (reported.has(message)) return;
    reported.add(message);
    console.warn(message);
  }

  function lookup(key) {
    const own = locales[code].strings[key];
    if (own !== undefined && own !== "") return { value: own, fallback: false };
    const english = source.strings[key];
    if (english === undefined) {
      report(`MycoQuest i18n: no English text for "${key}"`);
      return { value: key, fallback: false };
    }
    if (code !== "en") report(`MycoQuest i18n: "${key}" is missing in ${code}; showing English`);
    return { value: english, fallback: code !== "en" };
  }

  function format(value, vars = {}) {
    let text = value;
    if (value && typeof value === "object") text = value[rules.select(Number(vars.count))] ?? value.other;
    return String(text).replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  }

  // Plain text for a key. Values with {name} placeholders are filled from vars.
  const t = (key, vars) => format(lookup(key).value, vars);

  // Text that contains elements, such as a link inside a sentence: "Read {link}".
  function nodes(key, slots = {}, vars = {}) {
    return t(key, vars).split(/(\{\w+\})/).filter(Boolean).map((part) => {
      const match = /^\{(\w+)\}$/.exec(part);
      return match && slots[match[1]] ? slots[match[1]] : part;
    });
  }

  // Marks text that fell back to English so screen readers pronounce it correctly.
  function markFallback(node, fallback) {
    if (fallback) {
      node.setAttribute("lang", "en");
      node.setAttribute("data-i18n-fallback", "");
    } else if (node.hasAttribute("data-i18n-fallback")) {
      node.removeAttribute("lang");
      node.removeAttribute("data-i18n-fallback");
    }
  }

  // Fills static markup: data-i18n="key" sets the text, and child elements with data-slot="name"
  // are kept and placed at {name}. data-i18n-attr="aria-label:key; placeholder:key" sets attributes.
  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const { value, fallback } = lookup(node.dataset.i18n);
      const slots = {};
      node.querySelectorAll(":scope > [data-slot]").forEach((slot) => { slots[slot.dataset.slot] = slot; });
      if (Object.keys(slots).length) node.replaceChildren(...nodes(node.dataset.i18n, slots));
      else node.textContent = format(value);
      markFallback(node, fallback);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach((node) => {
      node.dataset.i18nAttr.split(";").map((pair) => pair.trim()).filter(Boolean).forEach((pair) => {
        const [attribute, key] = pair.split(":").map((part) => part.trim());
        node.setAttribute(attribute, t(key));
      });
    });
    document.documentElement.lang = locale();
  }

  const switches = new Set();
  function renderSwitch(container) {
    container.replaceChildren();
    container.className = "lang-switch";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", t("common.language.label"));
    const icon = document.createElement("span");
    icon.className = "lang-icon";
    icon.setAttribute("aria-hidden", "true");
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    const globe = document.createElementNS(svgNs, "path");
    globe.setAttribute("d", "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z");
    svg.append(globe);
    icon.append(svg);
    container.append(icon);
    enabled.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.lang = locales[option].meta.htmlLang;
      button.textContent = locales[option].meta.name;
      button.setAttribute("aria-pressed", String(option === code));
      button.addEventListener("click", () => {
        setLanguage(option);
        container.querySelector(`[aria-pressed="true"]`)?.focus();
      });
      container.append(button);
    });
  }
  function mountSwitch(container) {
    switches.add(container);
    renderSwitch(container);
  }

  function setLanguage(next) {
    if (!enabled.includes(next) || next === code) return;
    code = next;
    rules = new Intl.PluralRules(locale());
    try { localStorage.setItem(STORAGE_KEY, code); } catch (error) { /* kept for this page view */ }
    apply();
    switches.forEach(renderSwitch);
    window.dispatchEvent(new CustomEvent("mq:languagechange", { detail: { code } }));
  }

  // Locale-aware formatting. Dates stored as YYYY-MM-DD are read as local calendar days.
  const number = (value, options) => new Intl.NumberFormat(locale(), options).format(value);
  const currency = (cents) => new Intl.NumberFormat(locale(), { style: "currency", currency: "USD" }).format(cents / 100);
  function date(value, options = { year: "numeric", month: "short", day: "numeric" }) {
    let when = value;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      when = new Date(y, m - 1, d);
    }
    if (!(when instanceof Date) || Number.isNaN(when.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale(), options).format(when);
  }
  const has = (key) => source.strings[key] !== undefined;
  // Accent- and case-insensitive text for search, so "leon" finds "león".
  const fold = (text) => String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase(locale());

  window.I18N = { t, nodes, apply, mountSwitch, setLanguage, number, currency, date, has, fold, code: () => code, locale, enabled: () => [...enabled] };
})();
