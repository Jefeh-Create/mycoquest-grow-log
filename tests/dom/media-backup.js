async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const blobs = [];
  const realCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj) => { blobs.push(obj); return realCreate(obj); };
  const photo = () => new Promise((res) => { const c = document.createElement("canvas"); c.width = 50; c.height = 30; c.getContext("2d").fillRect(0, 0, 50, 30); c.toBlob((b) => res(new File([b], "p.png", { type: "image/png" })), "image/png"); });
  location.hash = "academy"; await h.sleep(200);
  [...document.querySelectorAll("#quest-picker button")].find((b) => /popcorn/i.test(b.textContent)).click(); await h.sleep(200);
  let step = h.$('.step[data-key="popcorn:soak"]');
  h.fill(h.$(".capture-caption", step), "Backup me");
  const dt = new DataTransfer(); dt.items.add(await photo());
  const input = h.$('input[data-capture="photo"]', step); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
  await h.until(() => /Saved/.test(h.$(".capture-slot .form-note", h.$('.step[data-key="popcorn:soak"]')).textContent), 5000);
  const journal = localStorage.getItem(KEY);
  h.check("capture exists before backup", JSON.parse(journal).trail.length === 1);

  // export photos & videos
  blobs.length = 0;
  h.click(h.$("#export-media-button"));
  await h.until(() => blobs.length >= 1, 5000);
  const text = await blobs[blobs.length - 1].text();
  const backup = JSON.parse(text);
  h.check("media backup is its own file format", backup.app === "MycoQuest media backup" && backup.version === 1 && backup.items.length === 1 && /^data:image\//.test(backup.items[0].dataUrl));
  h.check("main v2 export carries no media bytes", !JSON.stringify(JSON.parse(localStorage.getItem(KEY)).trail).includes("data:"));

  // lose the media (as if the browser cleared it), then restore from the file
  await new Promise((resolve) => { const open = indexedDB.open("mycoquest-grow-log-photos", 2); open.onsuccess = () => { const tx = open.result.transaction("media", "readwrite"); tx.objectStore("media").clear(); tx.oncomplete = () => resolve(); }; });
  const file = new File([text], "media.json", { type: "application/json" });
  const dt2 = new DataTransfer(); dt2.items.add(file);
  const importInput = h.$("#import-media-file"); importInput.files = dt2.files; importInput.dispatchEvent(new Event("change", { bubbles: true }));
  h.check("import reports the restored photo", await h.until(() => /1 photo/.test(h.$("#backup-message").textContent), 5000), h.$("#backup-message").textContent);
  const restored = await new Promise((resolve) => { const open = indexedDB.open("mycoquest-grow-log-photos", 2); open.onsuccess = () => { const tx = open.result.transaction("media", "readonly"); const req = tx.objectStore("media").getAll(); tx.oncomplete = () => resolve(req.result); }; });
  h.check("photo is back in the media store", restored.length === 1 && /^data:image\//.test(restored[0]));

  // junk files are refused
  const bad = new DataTransfer(); bad.items.add(new File(['{"app":"nope"}'], "bad.json", { type: "application/json" }));
  importInput.files = bad.files; importInput.dispatchEvent(new Event("change", { bubbles: true }));
  h.check("wrong file is refused with a message", await h.until(() => /media backup file/i.test(h.$("#backup-message").textContent), 3000), h.$("#backup-message").textContent);
}
