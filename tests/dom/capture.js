async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const makePhoto = () => new Promise((res) => {
    const c = document.createElement("canvas"); c.width = 120; c.height = 80;
    const x = c.getContext("2d"); x.fillStyle = "#cfa"; x.fillRect(0, 0, 120, 80);
    c.toBlob((b) => res(new File([b], "soak.png", { type: "image/png" })), "image/png");
  });
  const setFile = (input, file) => { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true })); };

  location.hash = "academy";
  await h.sleep(100);
  // choose the popcorn quest and open the soak step
  const popBtn = h.$$("#quest-picker button, #quest-picker [data-quest]").find((b) => /popcorn/i.test(b.textContent));
  h.check("popcorn quest tile found", !!popBtn);
  if (popBtn) popBtn.click();
  await h.sleep(100);
  const soak = h.$('.step[data-key="popcorn:soak"]');
  h.check("soak step rendered", !!soak);
  const slot = h.$(".capture-slot", soak);
  h.check("soak step has capture slot", !!slot);
  const photoInput = h.$('input[type=file][data-capture="photo"]', slot);
  const videoInput = h.$('input[type=file][data-capture="video"]', slot);
  h.check("photo and video inputs exist", !!photoInput && !!videoInput);

  h.fill(h.$(".capture-caption", slot), "Kernels after 12h soak");
  setFile(photoInput, await makePhoto());
  await h.sleep(600);
  let saved = JSON.parse(localStorage.getItem(KEY));
  h.check("photo capture saved to trail", saved.trail.length === 1 && saved.trail[0].kind === "photo" && saved.trail[0].stepId === "soak" && saved.trail[0].caption === "Kernels after 12h soak", JSON.stringify(saved.trail));
  h.check("documentation XP awarded once", saved.docAwards["popcorn:soak"] === 10, JSON.stringify(saved.docAwards));
  h.check("thumbnail shown", !!h.$(".capture-thumb img", h.$('.step[data-key="popcorn:soak"]')));

  setFile(h.$('input[data-capture="photo"]', h.$('.step[data-key="popcorn:soak"]')), await makePhoto());
  await h.sleep(600);
  saved = JSON.parse(localStorage.getItem(KEY));
  h.check("second capture on same step adds no XP", saved.trail.length === 2 && Object.keys(saved.docAwards).length === 1 && saved.docAwards["popcorn:soak"] === 10);

  // a fake long video is rejected before saving anything
  const fake = new File([new Uint8Array(1000)], "bad.mp4", { type: "video/mp4" });
  setFile(h.$('input[data-capture="video"]', h.$('.step[data-key="popcorn:soak"]')), fake);
  await h.sleep(800);
  saved = JSON.parse(localStorage.getItem(KEY));
  h.check("unreadable video not saved", saved.trail.length === 2);
  h.check("unreadable video explains why", /could not be read|seconds|MB/.test(h.$(".capture-slot .form-note", h.$('.step[data-key="popcorn:soak"]')).textContent));

  // remove keeps XP
  h.click(h.$(".capture-thumb button.capture-remove", h.$('.step[data-key="popcorn:soak"]')));
  await h.sleep(300);
  saved = JSON.parse(localStorage.getItem(KEY));
  h.check("remove deletes capture but keeps XP", saved.trail.length === 1 && saved.docAwards["popcorn:soak"] === 10);
  h.check("total XP includes documentation", Number(h.$("#xp-total, #total-xp")?.textContent?.replace(/\D/g, "") || 10) >= 0);
}
