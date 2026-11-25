async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  h.click(h.$("[data-load-sample]") || h.$$("button").find((b) => /sample journal/i.test(b.textContent)));
  await h.until(() => JSON.parse(localStorage.getItem(KEY) || "{}").sample === true, 4000);
  const saved = JSON.parse(localStorage.getItem(KEY));
  h.check("sample journal ships a process trail", saved.trail.length === 5 && Object.keys(saved.docAwards).length === 5, JSON.stringify(saved.trail.length));
  h.check("Documented trophy unlocked by 5 documented steps", !!(saved.trophies && saved.trophies.documented), JSON.stringify(saved.trophies));
  h.check("Documented trophy card is shown", [...document.querySelectorAll("#trophy-grid .trophy-card")].some((t) => /Documented/.test(t.textContent) && t.classList.contains("unlocked")));
  // the sample unlocks several trophies at once: one summary celebration, then the replay starts
  const dlg = () => document.getElementById("celebrate-dialog");
  h.check("sample unlocks a trophy celebration", await h.until(() => dlg() && dlg().open, 6000));
  h.check("burst of trophies becomes one summary", /trophies collected/.test(h.$("#celebrate-title").textContent), h.$("#celebrate-title").textContent);
  h.click(h.$("#celebrate-collect")); await h.sleep(500);
  location.hash = "map"; await h.sleep(500);
  const svg = h.$("#mycelial-map");
  h.check("trail captures appear as map nodes", h.$$(".process-node", svg).length >= 5, String(h.$$(".process-node", svg).length));
  const soak = h.$$(".process-node .map-emoji", svg).find((n) => /soak/i.test(n.getAttribute("aria-label")));
  h.check("sample soak capture node exists", !!soak);
  h.click(soak);
  h.check("sample capture opens its generated photo", await h.until(() => !!h.$("#map-detail img.map-detail-photo"), 4000));

  // controls: the sample auto-starts a replay; speed, pause, resume, scrub
  const button = h.$("#map-replay");
  await h.until(() => /Pause/.test(button.textContent), 6000);
  h.check("replay auto-starts after the sample loads", /Pause/.test(button.textContent), button.textContent);
  h.fill(h.$("#map-speed"), "2");
  button.click(); await h.sleep(150);
  h.check("pause button pauses", /Resume/.test(button.textContent) && button.getAttribute("aria-pressed") === "false", button.textContent);
  const scrub = h.$("#map-replay-scrub");
  const before = h.$("#map-detail").textContent;
  h.fill(scrub, "300"); await h.sleep(150);
  h.check("scrubbing keeps it paused and moves the map", /Resume/.test(button.textContent) && h.$("#map-detail").textContent.length > 0);
  button.click(); await h.sleep(150);
  h.check("resume continues playing", /Pause/.test(button.textContent));
  h.fill(scrub, "950");
  h.check("playing to the end resets the button", await h.until(() => /Replay growth/.test(button.textContent), 12000), button.textContent);
  h.check("scrubber reads full at the end", scrub.value === "1000", scrub.value);
  button.click(); await h.sleep(200);
  h.check("replay can be started again", /Pause/.test(button.textContent));
}
