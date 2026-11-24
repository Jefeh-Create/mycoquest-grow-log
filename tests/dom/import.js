async function scenario(h) {
  const KEY = "mycoquest-standalone-grow-log-v3";
  const importFile = async (obj) => {
    const input = h.$("#import-grow-file");
    const dt = new DataTransfer(); dt.items.add(new File([JSON.stringify(obj)], "x.json", { type: "application/json" }));
    input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    await h.sleep(700);
  };
  window.confirm = () => true;
  // 1. an old-style v2 file (no trail, no incidentNote) still imports
  await importFile({ app: "MycoQuest grow log", version: 2, grows: [{ name: "Old grow", species: "Shiitake", startDate: "2026-10-01" }], entries: [
    { growName: "Old grow", species: "Shiitake", stage: "Colonization", observation: "white", date: "2026-10-05", postId: "old-1", status: "approved" }], recipes: [] });
  let saved = JSON.parse(localStorage.getItem(KEY));
  h.check("old v2 file imports unchanged", saved.entries.length === 1 && saved.grows.length === 1 && saved.entries[0].incidentNote === "", JSON.stringify(saved.entries));
  // 2. new extras round-trip
  await importFile({ app: "MycoQuest grow log", version: 2, recipes: [],
    grows: [{ name: "Plan grow", species: "Lion's mane", startDate: "", planning: true, planningDetail: { substrate: "Sawdust", evil: "x" } }],
    entries: [{ growName: "Old grow", species: "Shiitake", stage: "Fruiting", observation: "pins", date: "2026-10-12", postId: "new-1", status: "approved", appearance: "Possible contamination", incidentNote: "Too humid <b>maybe</b>" }],
    trail: [{ id: "cap-1", growName: "Plan grow", species: "Lion's mane", questId: "popcorn", stepId: "soak", kind: "video", caption: "soaking", takenAt: "2026-11-01T00:00:00Z", hasVideo: true },
            { id: "cap-2", growName: "Ghost", species: "None", kind: "photo", caption: "orphan" }],
    docAwards: { "popcorn:soak": 10 } });
  saved = JSON.parse(localStorage.getItem(KEY));
  const plan = saved.grows.find((g) => g.name === "Plan grow");
  h.check("planning grow restored as planning", !!plan && plan.planning === true && plan.startDate === "", JSON.stringify(plan));
  h.check("planning detail cleaned", plan && plan.planningDetail && plan.planningDetail.substrate === "Sawdust" && !("evil" in plan.planningDetail));
  h.check("incidentNote imported as plain text", saved.entries.some((e) => e.incidentNote === "Too humid <b>maybe</b>"));
  h.check("trail caption kept, orphan dropped", saved.trail.length === 1 && saved.trail[0].id === "cap-1" && saved.trail[0].hasMedia === false, JSON.stringify(saved.trail));
  h.check("doc awards merged", saved.docAwards["popcorn:soak"] === 10);
}
