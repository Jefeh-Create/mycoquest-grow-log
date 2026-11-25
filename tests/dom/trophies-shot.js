// Visual check helper: run with SHOT=<png> and query ?celebrate (celebration open) or ?shelf (trophy shelf in view).
async function scenario(h) {
  const dlg = () => document.getElementById("celebrate-dialog");
  window.confirm = () => true;
  const input = h.$("#import-grow-file");
  const dt = new DataTransfer();
  dt.items.add(new File([JSON.stringify({ app: "MycoQuest grow log", version: 2, grows: [], entries: [], recipes: [], docAwards: { a: 10, b: 10, c: 10, d: 10, e: 10 } })], "x.json", { type: "application/json" }));
  input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
  await h.until(() => dlg() && dlg().open, 5000);
  if (location.search.includes("celebrate")) { await h.sleep(2200); h.check("celebration captured", true); return; }
  h.click(h.$("#celebrate-collect")); await h.until(() => dlg().open, 4000); h.click(h.$("#celebrate-collect")); await h.sleep(400);
  h.$("#trophies").scrollIntoView(); await h.sleep(800);
  h.check("shelf captured", true);
}
