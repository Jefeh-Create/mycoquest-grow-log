// Moving a capture to another grow, and trimming a video (a saved play range; the clip itself is kept).
// node tests/dom.mjs tests/dom/move-trim.js
async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const saved = () => JSON.parse(localStorage.getItem(KEY));
  const setFile = (input, file) => { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true })); };
  window.confirm = () => true;

  // A 3 second clip recorded from a canvas, so a real video goes through the real media restore path.
  const recordClip = () => new Promise((resolve) => {
    const c = document.createElement("canvas"); c.width = 160; c.height = 100; const x = c.getContext("2d");
    const rec = new MediaRecorder(c.captureStream(20), { mimeType: "video/webm" }); const parts = [];
    rec.ondataavailable = (e) => parts.push(e.data); rec.onstop = () => resolve(new Blob(parts, { type: "video/webm" }));
    let f = 0; const t = setInterval(() => { x.fillStyle = `hsl(${f * 12} 60% 50%)`; x.fillRect(0, 0, 160, 100); f += 1; }, 50);
    rec.start(); setTimeout(() => { clearInterval(t); rec.stop(); }, 3000);
  });
  const toDataUrl = (blob) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });

  // Two grows, and a video capture on the first one.
  setFile(h.$("#import-grow-file"), new File([JSON.stringify({ app: "MycoQuest grow log", version: 2, recipes: [], entries: [],
    grows: [{ name: "Grow A", species: "Blue oyster", startDate: "2026-11-01" }, { name: "Grow B", species: "Lion's mane", startDate: "2026-11-02" }],
    trail: [{ id: "cap-vid", growName: "Grow A", species: "Blue oyster", questId: "popcorn", stepId: "soak", kind: "video", caption: "soak clip", takenAt: "2026-11-03T00:00:00Z", hasVideo: true }] })], "j.json", { type: "application/json" }));
  await h.until(() => saved() && saved().trail.length === 1, 4000);
  const clip = await recordClip();
  setFile(h.$("#import-media-file"), new File([JSON.stringify({ app: "MycoQuest media backup", version: 1, items: [{ id: "cap-vid", kind: "video", dataUrl: await toDataUrl(clip) }] })], "m.json", { type: "application/json" }));
  h.check("video restored", await h.until(() => /1 photo/.test(h.$("#backup-message").textContent), 6000), h.$("#backup-message").textContent);
  const growA = saved().grows.find((g) => g.name === "Grow A"), growB = saved().grows.find((g) => g.name === "Grow B");

  // Open the step in the Academy, with the quest's planning grow set to Grow A, so the capture shows.
  location.hash = "academy"; await h.sleep(200);
  h.$$("#quest-picker button").find((b) => /popcorn/i.test(b.textContent)).click(); await h.sleep(200);
  const growSelect = h.$('.step[data-key="popcorn:soak"] .capture-grow select');
  if (growSelect) { h.fill(growSelect, growA.id); await h.sleep(300); }
  let step = h.$('.step[data-key="popcorn:soak"]');
  const thumb = h.$(".capture-thumb", step);
  h.check("capture thumbnail shown", !!thumb);
  h.check("video element shown", await h.until(() => !!h.$(".capture-thumb video", h.$('.step[data-key="popcorn:soak"]')), 3000));

  // Trim.
  step = h.$('.step[data-key="popcorn:soak"]');
  const editor = h.$(".trim-editor", step);
  h.check("video has a trim control", !!editor);
  editor.open = true;
  const [start, end] = h.$$('input[type="range"]', editor);
  h.check("trim sliders are labelled", /start/i.test(start.getAttribute("aria-label")) && /end/i.test(end.getAttribute("aria-label")));
  h.fill(start, "0.5"); h.fill(end, "2");
  h.click(h.$$("button", editor).find((b) => /Save trim/.test(b.textContent)));
  await h.sleep(200);
  const trimmed = saved().trail[0];
  h.check("trim saved as a play range", trimmed.trim && trimmed.trim.start === 0.5 && trimmed.trim.end === 2, JSON.stringify(trimmed.trim));
  h.check("trim shown on the thumbnail", /trimmed 0\.5–2\.0 s/.test(h.$(".capture-thumb small", h.$('.step[data-key="popcorn:soak"]')).textContent));
  const stored = await new Promise((resolve) => { const open = indexedDB.open("mycoquest-grow-log-photos", 2); open.onsuccess = () => { const req = open.result.transaction("media").objectStore("media").get("cap-vid"); req.onsuccess = () => resolve(req.result); }; });
  h.check("original clip kept unchanged", stored && stored.size === clip.size, String(stored && stored.size));

  // Playback stops at the trim end.
  const video = h.$(".capture-thumb video", h.$('.step[data-key="popcorn:soak"]'));
  video.muted = true;
  await h.until(() => video.readyState >= 1, 3000);
  try { await video.play(); } catch (e) { /* autoplay */ }
  h.check("playback starts at the trim start", video.currentTime >= 0.4, String(video.currentTime));
  await h.sleep(2600);
  h.check("playback stops at the trim end", video.paused && video.currentTime < 2.3, `paused ${video.paused} at ${video.currentTime}`);

  // The export carries the trim.
  const blobs = []; const real = URL.createObjectURL.bind(URL); URL.createObjectURL = (o) => { blobs.push(o); return real(o); };
  h.click(h.$("#export-button")); await h.until(() => blobs.length, 3000);
  const exported = JSON.parse(await blobs[blobs.length - 1].text());
  h.check("export keeps the trim", exported.trail[0].trim && exported.trail[0].trim.end === 2, JSON.stringify(exported.trail[0]));

  // Undo the trim.
  const editor2 = h.$(".trim-editor", h.$('.step[data-key="popcorn:soak"]')); editor2.open = true;
  h.click(h.$$("button", editor2).find((b) => /full clip/.test(b.textContent))); await h.sleep(200);
  h.check("trim can be removed", !("trim" in saved().trail[0]));

  // Move to Grow B.
  const move = h.$(".capture-move", h.$('.step[data-key="popcorn:soak"]'));
  h.check("move control lists both grows", !!move && [...move.options].some((o) => o.value === growB.id) && move.value === growA.id);
  h.fill(move, growB.id); await h.sleep(200);
  h.check("capture moved to Grow B", saved().trail[0].growId === growB.id);
  h.check("move is announced", /Moved to Grow B/.test(h.$(".capture-slot .form-note[role=status]", h.$('.step[data-key="popcorn:soak"]')).textContent));
  location.hash = "map"; await h.sleep(500);
  h.check("map still renders after the move", h.$$("#mycelial-map .branch, #mycelial-map g").length > 0);
}
