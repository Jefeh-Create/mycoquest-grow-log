async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const dlg = () => document.getElementById("celebrate-dialog");
  const importFile = async (obj) => {
    const input = h.$("#import-grow-file");
    const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify(obj)], "x.json", { type: "application/json" }));
    input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  // before anything: the shelf has all ten trophies, locked, each with a medallion and a progress ring
  h.check("shelf summary renders", !!h.$("#trophy-shelf .shelf-ring"));
  const cards0 = h.$$("#trophy-grid .trophy-card");
  h.check("ten trophies on the shelf", cards0.length === 10, String(cards0.length));
  h.check("every card has a mushroom medallion", cards0.every((c) => !!h.$("svg.medal", c)));
  h.check("locked trophies are silhouettes", cards0.every((c) => !!h.$(".medal.is-locked", c)));
  h.check("level card shows a mushroom rank", /Spore/.test(h.$("#level-value").textContent) && !!h.$("#rank-badge svg"), h.$("#level-value").textContent);

  // earn the Documented trophy by documenting five steps (arrives through a v2 import)
  window.confirm = () => true;
  await importFile({ app: "MycoQuest grow log", version: 2, grows: [], entries: [], recipes: [],
    docAwards: { "popcorn:kit": 10, "popcorn:soak": 10, "popcorn:simmer": 10, "popcorn:dry": 10, "popcorn:fill": 10 } });
  h.check("celebration opens for the new trophy", await h.until(() => dlg() && dlg().open, 5000));
  h.check("celebration names the trophy", /Documented/.test(h.$("#celebrate-title").textContent), h.$("#celebrate-title").textContent);
  h.check("celebration shows its rarity", /Pin/.test(h.$("#celebrate-dialog .celebrate-rarity").textContent), h.$("#celebrate-dialog .celebrate-rarity").textContent);
  h.check("celebration medallion spawns from the soil", !!h.$("#celebrate-dialog .celebrate-medal.spawn-up svg.medal") && !!h.$("#celebrate-dialog .soil"));
  h.check("celebration counts up the XP reward", await h.until(() => /\+150 XP/.test(h.$("#celebrate-dialog .celebrate-xp").textContent), 3000), h.$("#celebrate-dialog .celebrate-xp").textContent);
  h.check("celebration releases spores", h.$$("#celebrate-dialog .spore-particle").length >= 12);
  h.check("collect button takes focus", document.activeElement === h.$("#celebrate-collect"));
  const saved = JSON.parse(localStorage.getItem(KEY));
  h.check("trophy persisted as unlocked", !!saved.trophies.documented);
  h.click(h.$("#celebrate-collect"));
  h.check("collecting closes the celebration", !dlg().open);

  // the level it unlocked gets its own celebration with a mushroom rank
  h.check("level-up celebration follows", await h.until(() => dlg().open && /Level 2/.test(h.$("#celebrate-title").textContent), 5000), h.$("#celebrate-title").textContent);
  h.click(h.$("#celebrate-collect"));
  await h.sleep(200);

  // shelf reflects it
  h.check("shelf counts the collected trophy", /1\/10/.test(h.$("#trophy-shelf").textContent) && /1 of 10/.test(h.$("#trophy-count").textContent), h.$("#trophy-shelf").textContent);
  const docCard = h.$$("#trophy-grid .trophy-card").find((c) => /Documented/.test(c.textContent));
  h.check("collected trophy is in full colour with its rarity", !!docCard && docCard.classList.contains("unlocked") && !h.$(".medal.is-locked", docCard) && /Pin/.test(docCard.textContent));
  const lockedCard = h.$$("#trophy-grid .trophy-card").find((c) => /Week Warrior/.test(c.textContent));
  h.check("locked trophy shows a progress ring", !!h.$(".medal-progress", lockedCard));
  const mycologist = h.$$("#trophy-grid .trophy-card").find((c) => /Master Mycologist/.test(c.textContent));
  h.check("Master Mycologist tracks the rest of the shelf", /1 \/ 9/.test(mycologist.textContent), mycologist.textContent);

  // filters
  h.click(h.$$("#trophy-filters button").find((b) => /Collected/.test(b.textContent)));
  await h.sleep(100);
  h.check("Collected filter shows only collected trophies", h.$$("#trophy-grid .trophy-card").length === 1);
  h.click(h.$$("#trophy-filters button").find((b) => /All/.test(b.textContent)));
  await h.sleep(100);
  h.check("All filter restores the shelf", h.$$("#trophy-grid .trophy-card").length === 10);

  // detail dialogs
  h.click(lockedCard);
  const detail = document.getElementById("trophy-detail");
  h.check("locked trophy opens a how-to-earn detail", await h.until(() => detail && detail.open, 2000) && /7-check-in streak|Keep a 7-check-in streak/.test(detail.textContent) && /0 \/ 7/.test(detail.textContent), detail && detail.textContent);
  h.check("detail offers a way to go earn it", !!h.$$("a, button", detail).find((el) => /Check in today/.test(el.textContent)));
  h.click(h.$$("button", detail).find((b) => /Close/.test(b.textContent)));
  h.click(docCard);
  await h.until(() => detail.open, 2000);
  h.check("collected trophy offers a replay of its unlock", !!h.$$("button", detail).find((b) => /Replay/.test(b.textContent)));
  h.click(h.$$("button", detail).find((b) => /Replay/.test(b.textContent)));
  h.check("replay reopens the celebration", await h.until(() => dlg().open && /Documented/.test(h.$("#celebrate-title").textContent), 4000));
  h.click(h.$("#celebrate-collect"));
  h.$("#trophies").scrollIntoView();
}
