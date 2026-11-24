async function scenario(h) {
  // a grow with a harvest check-in and a real photo, built through the real UI
  const form = h.$("#new-grow-form");
  h.fill(form.elements.name, "Oyster batch"); h.fill(form.elements.species, "Blue oyster"); h.submit(form);
  await h.sleep(150);
  h.click(h.$$("#grow-list button").find((b) => /check-in/i.test(b.textContent)));
  await h.sleep(150);
  const cf = h.$("#checkin-form");
  h.fill(cf.elements.stage, "Harvest");
  h.fill(cf.elements.flushNumber, "1"); h.fill(cf.elements.freshYieldG, "120");
  const c = document.createElement("canvas"); c.width = 160; c.height = 100; const x = c.getContext("2d"); x.fillStyle = "#d9c7e8"; x.fillRect(0, 0, 160, 100); x.fillStyle = "#fff"; x.fillRect(40, 20, 80, 40);
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const dt = new DataTransfer(); dt.items.add(new File([blob], "harvest.png", { type: "image/png" }));
  h.$("#checkin-photo").files = dt.files; h.$("#checkin-photo").dispatchEvent(new Event("change", { bubbles: true }));
  await h.sleep(400);
  h.submit(cf);
  await h.until(() => JSON.parse(localStorage.getItem("mycoquest-standalone-grow-log-v3")).entries.length === 1, 4000);
  location.hash = "map"; await h.sleep(500);
  const svg = h.$("#mycelial-map");

  // legend became interactive stage chips with emoji badges and counts
  const chips = h.$$(".stage-chip");
  h.check("six stage chips with emoji badges", chips.length === 6 && chips.every((chip) => h.$(".chip-badge", chip).textContent.trim().length > 0), String(chips.length));
  h.check("five stat tiles", h.$$(".stat-tile").length === 5);
  h.check("entry node shows its stage emoji", !!h.$(".stage-emoji", svg) && h.$(".stage-emoji", svg).textContent.includes("🧺"));
  const harvestChip = chips.find((chip) => /Harvest/.test(chip.textContent));
  h.check("Harvest chip counts the harvest check-in", h.$(".chip-count", harvestChip).textContent === "1");
  harvestChip.click(); await h.sleep(100);
  h.check("chip click filters the map", svg.classList.contains("has-stage-filter") && h.$$(".stage-match", svg).length >= 1 && harvestChip.getAttribute("aria-pressed") === "true");
  harvestChip.click(); await h.sleep(100);
  h.check("second click clears the filter", !svg.classList.contains("has-stage-filter"));

  // replay runs through to the harvest finale: the real photo spawns out of the substrate
  const replay = h.$("#map-replay");
  h.check("replay is available for a single grow", replay.disabled === false);
  replay.click();
  h.check("replay finale shows the user's harvest photo", await h.until(() => !!h.$(".finale image", svg), 15000));
  const image = h.$(".finale image", svg);
  h.check("finale uses the real photo", /^data:image\/png|^data:image\/jpeg/.test(image.getAttribute("href")));
  h.check("finale body spawns like a mushroom", !!h.$(".finale .mush.spawn", svg));
  h.check("finale label shows flush and yield", /Flush 1/.test(h.$(".finale-label", svg).textContent) && /120/.test(h.$(".finale-label", svg).textContent));
  if (location.search.includes("keep")) { await h.sleep(1500); h.$("#map").scrollIntoView(); return; }
  h.$(".finale", svg).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  h.check("finale can be dismissed", !h.$(".finale", svg));
  h.$("#map").scrollIntoView();
}
