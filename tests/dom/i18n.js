// The whole app in Spanish: no missing text, saved data stays English, the choice persists, and English comes back.
// node tests/dom.mjs tests/dom/i18n.js   (add PHONE=320x568 to also check for sideways scrolling on a small phone)
async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const warnings = [];
  const realWarn = console.warn; console.warn = (...args) => { warnings.push(args.join(" ")); realWarn.apply(console, args); };
  window.confirm = () => true;

  h.check("English is the default", document.documentElement.lang === "en" && /Tend your grows/.test(h.$("#grows-title").textContent));
  const switcher = h.$("#language-switch");
  const buttons = h.$$("#language-switch button");
  h.check("selector shows native names with their own lang", buttons.map((b) => b.textContent).join("|") === "English|Español" && buttons[1].lang === "es-US");
  h.check("selector is a labelled group with pressed state", switcher.getAttribute("role") === "group" && !!switcher.getAttribute("aria-label") && buttons[0].getAttribute("aria-pressed") === "true");

  // A real grow and check-in made in Spanish.
  h.click(buttons[1]); await h.sleep(200);
  h.check("html lang switches to es-US", document.documentElement.lang === "es-US");
  h.check("language choice saved on its own key", localStorage.getItem("mycoquest-language") === "es");
  h.check("static text is Spanish", /Cuida tus cultivos/.test(h.$("#grows-title").textContent) && h.$("title").textContent === "Diario de cultivo MycoQuest");
  const form = h.$("#new-grow-form");
  h.fill(form.elements.name, "Lote de prueba"); h.fill(form.elements.species, "Orellana"); h.submit(form);
  await h.sleep(300);
  h.click(h.$$("#grow-list button").find((b) => /Registro de hoy/.test(b.textContent)));
  await h.sleep(200);
  const stageOptions = [...h.$("#checkin-stage").options];
  h.check("stage options show Spanish but keep English values", stageOptions.some((o) => o.value === "Colonization" && o.textContent === "Colonización"));
  h.fill(h.$("#checkin-form").elements.stage, "Colonization");
  h.fill(h.$("#checkin-form").elements.appearance, "Needs attention");
  h.submit(h.$("#checkin-form"));
  await h.until(() => JSON.parse(localStorage.getItem(KEY)).entries.length === 1, 3000);
  const saved = JSON.parse(localStorage.getItem(KEY)).entries[0];
  h.check("saved stage and appearance stay English", saved.stage === "Colonization" && saved.appearance === "Needs attention", JSON.stringify([saved.stage, saved.appearance]));
  h.check("typed names are kept as typed", JSON.parse(localStorage.getItem(KEY)).grows[0].name === "Lote de prueba");
  for (const d of document.querySelectorAll("dialog[open]")) d.close();

  // Reset and walk every tab of the sample journal in Spanish.
  localStorage.removeItem(KEY);
  h.click(h.$("#reset-button")); await h.sleep(300);
  for (const d of document.querySelectorAll("dialog[open]")) d.close();
  h.click(h.$("[data-load-sample]")); await h.sleep(1200);
  for (let i = 0; i < 12; i += 1) { const d = h.$("dialog[open]"); if (!d) break; d.close(); await h.sleep(350); }
  const english = /\b(the|your|check-in|grow log|Harvest|Fruiting|Colonization|trophy|Next up|Replay|Copy story)\b/;
  const leftovers = [];
  for (const tab of ["grows", "academy", "map", "stories", "trophies", "backup"]) {
    location.hash = tab; await h.sleep(500);
    for (const d of document.querySelectorAll("dialog[open]")) d.close();
    const section = h.$$(`[data-tab="${tab}"]`).filter((s) => !s.classList.contains("tab-off"));
    section.forEach((s) => {
      const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode, text = node.textContent.trim();
        if (!text || node.parentElement.closest("[lang='en'], script, style")) continue;
        if (english.test(text)) leftovers.push(tab + ": " + text.slice(0, 80));
      }
    });
    if (tab === "academy") {
      h.$$(".quest-card").forEach((card) => card.click());
      await h.sleep(200);
      h.$$("details.step").forEach((d) => { d.open = true; });
      await h.sleep(200);
    }
    if (tab === "map") h.check("map caption is Spanish", /registros/.test(h.$("#mycelial-map").textContent + h.$(".map-panel").textContent));
    if (tab === "trophies") {
      h.click(h.$(".trophy-card")); await h.until(() => h.$("#trophy-detail") && h.$("#trophy-detail").open, 1500);
      h.check("trophy detail is Spanish", /Rareza|Cómo ganarlo|Conseguido/.test(h.$("#trophy-detail").textContent));
      h.$("#trophy-detail").close();
    }
  }
  h.check("no English left in the Spanish journal", !leftovers.length, leftovers.slice(0, 6).join(" || "));
  h.check("no fallback-to-English markers", !h.$("[data-i18n-fallback]"), (h.$("[data-i18n-fallback]") || {}).outerHTML);
  h.check("no missing-text warnings", !warnings.some((w) => /i18n/.test(w)), warnings.filter((w) => /i18n/.test(w)).slice(0, 5).join(" | "));
  h.check("dates use Spanish month names", /\b(ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\b/i.test(document.body.textContent));
  h.check("no sideways scrolling", document.documentElement.scrollWidth <= window.innerWidth + 1, document.documentElement.scrollWidth + " > " + window.innerWidth);
  h.check("sample data is written in Spanish", JSON.parse(localStorage.getItem(KEY)).grows.some((g) => /Pasteles BRF/.test(g.name)));
  h.check("sample stages stay English in storage", JSON.parse(localStorage.getItem(KEY)).entries.every((e) => ["Planning", "Inoculation", "Colonization", "Fruiting", "Harvest", "Complete"].includes(e.stage)));

  // Back to English, live.
  h.click(h.$$("#language-switch button")[0]); await h.sleep(300);
  location.hash = "grows"; await h.sleep(300);
  h.check("switching back restores English", document.documentElement.lang === "en" && /Tend your grows/.test(h.$("#grows-title").textContent) && localStorage.getItem("mycoquest-language") === "en");
  h.check("typed sample data is not rewritten", JSON.parse(localStorage.getItem(KEY)).grows.some((g) => /Pasteles BRF/.test(g.name)));
}
