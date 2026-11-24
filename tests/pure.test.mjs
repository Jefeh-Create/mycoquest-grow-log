import assert from "node:assert/strict";
import { loadPure } from "./harness.mjs";

test("harness loads a pure block from grow-log.html", () => {
  assert.equal(loadPure(["smoke"]).smokeOk, true);
});

test("validateVideo accepts a short small clip", () => {
  const { validateVideo } = loadPure(["media-rules"]);
  const result = validateVideo({ size: 5e6, duration: 15 });
  assert.equal(result.ok, true);
  assert.equal(result.reason, undefined);
});
test("validateVideo rejects clips over 15 seconds", () => {
  const { validateVideo } = loadPure(["media-rules"]);
  const result = validateVideo({ size: 5e6, duration: 15.5 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /15 seconds/);
});
test("validateVideo rejects files over 25 MB", () => {
  const { validateVideo } = loadPure(["media-rules"]);
  const result = validateVideo({ size: 25 * 1024 * 1024 + 1, duration: 10 });
  assert.equal(result.ok, false);
  assert.match(result.reason, /25 MB/);
});
test("validateVideo rejects an unreadable duration", () => {
  const { validateVideo } = loadPure(["media-rules"]);
  assert.equal(validateVideo({ size: 1000, duration: NaN }).ok, false);
});
test("documentationKey joins quest and step", () => {
  assert.equal(loadPure(["media-rules"]).documentationKey("popcorn", "soak"), "popcorn:soak");
});
test("docXpFor pays once per step key and totalDocXp sums awards", () => {
  const { docXpFor, totalDocXp, DOC_XP } = loadPure(["media-rules"]);
  assert.equal(docXpFor({}, "popcorn:soak"), DOC_XP);
  assert.equal(docXpFor({ "popcorn:soak": 10 }, "popcorn:soak"), 0);
  assert.equal(totalDocXp({ a: 10, b: 10 }), 20);
  assert.equal(totalDocXp(undefined), 0);
});

test("validateInoculationDate accepts today and past dates", () => {
  const { validateInoculationDate } = loadPure(["planning"]);
  assert.equal(validateInoculationDate("2026-11-24", "2026-11-24").ok, true);
  assert.equal(validateInoculationDate("2026-11-01", "2026-11-24").ok, true);
});
test("validateInoculationDate rejects future, blank, and malformed dates", () => {
  const { validateInoculationDate } = loadPure(["planning"]);
  const future = validateInoculationDate("2026-11-25", "2026-11-24");
  assert.equal(future.ok, false);
  assert.match(future.reason, /future/);
  assert.equal(validateInoculationDate("", "2026-11-24").ok, false);
  assert.equal(validateInoculationDate("2026-13-40", "2026-11-24").ok, false);
});
test("cleanPlanningDetail keeps known fields, trims, and caps length", () => {
  const { cleanPlanningDetail } = loadPure(["planning"]);
  const result = cleanPlanningDetail({ grain: "  Rye berries ", substrate: "  BRF  ", waterRatio: "1:1", sterilizationMin: "45", notes: "x".repeat(900), evil: "drop me" });
  assert.equal(result.substrate, "BRF");
  assert.equal(result.grain, "Rye berries");
  assert.equal(result.sterilizationMin, 45);
  assert.equal(result.notes.length, 500);
  assert.equal("evil" in result, false);
  assert.equal(cleanPlanningDetail({ sterilizationMin: "abc" }).sterilizationMin, undefined);
});

test("speciesFamily maps common and Latin names", () => {
  const { speciesFamily } = loadPure(["mushrooms"]);
  assert.equal(speciesFamily("Lion's mane"), "lionsmane");
  assert.equal(speciesFamily("Blue oyster"), "oyster");
  assert.equal(speciesFamily("Pleurotus ostreatus"), "oyster");
  assert.equal(speciesFamily("Shiitake"), "shiitake");
  assert.equal(speciesFamily("King oyster"), "kingoyster");
  assert.equal(speciesFamily("Unknownus fungus"), "button");
  assert.equal(speciesFamily(undefined), "button");
});
test("pickMushroom is deterministic and varies by seed within the family palette", () => {
  const { pickMushroom, MUSHROOM_FAMILIES } = loadPure(["mushrooms"]);
  assert.equal(JSON.stringify(pickMushroom("Blue oyster", "a")), JSON.stringify(pickMushroom("Blue oyster", "a")));
  assert.ok(MUSHROOM_FAMILIES.oyster.caps.includes(pickMushroom("Blue oyster", "a").capColor));
  const colors = new Set("abcdefghijklmnopqrstuvwxyz".split("").map((s) => pickMushroom("Blue oyster", s).capColor));
  assert.ok(colors.size >= 3, "expected at least 3 distinct cap colors, got " + colors.size);
});
test("every family has a palette, a spore print, and a label", () => {
  const { MUSHROOM_FAMILIES } = loadPure(["mushrooms"]);
  const ids = Object.keys(MUSHROOM_FAMILIES);
  assert.equal(ids.length, 12);
  ids.forEach((id) => { const f = MUSHROOM_FAMILIES[id]; assert.ok(f.caps.length >= 3 && f.sporePrint && f.label, id); });
});

test("trailForExport carries captions but never media bytes", () => {
  const { trailForExport } = loadPure(["export-extras"]);
  const out = trailForExport([
    { id: "c1", growId: "g1", questId: "popcorn", stepId: "soak", kind: "photo", caption: "soaked", takenAt: "2026-11-24T10:00:00Z", dataUrl: "data:image/png;base64,AAA", blob: {} },
    { id: "c2", growId: "g1", questId: "popcorn", stepId: "simmer", kind: "video", caption: "", takenAt: "2026-11-24T11:00:00Z" }
  ], (id) => ({ name: "Batch", species: "Blue oyster" }));
  assert.equal(out.length, 2);
  assert.equal("dataUrl" in out[0] || "blob" in out[0], false);
  assert.equal(out[0].hasVideo, false);
  assert.equal(out[1].hasVideo, true);
  assert.equal(out[0].growName, "Batch");
});
test("mergeTrail de-duplicates by id and drops items whose grow is unknown", () => {
  const { mergeTrail } = loadPure(["export-extras"]);
  const existing = [{ id: "c1", growId: "g1", kind: "photo", caption: "a" }];
  const incoming = [
    { id: "c1", growName: "Batch", species: "Oyster", kind: "photo", caption: "dup" },
    { id: "c2", growName: "Batch", species: "Oyster", kind: "video", caption: "new", hasVideo: true, questId: "q", stepId: "s", takenAt: "t" },
    { id: "c3", growName: "Nope", species: "X", kind: "photo", caption: "orphan" }
  ];
  const merged = mergeTrail(existing, incoming, (name) => (name === "Batch" ? "g1" : null));
  assert.deepEqual(merged.map((item) => item.id), ["c1", "c2"]);
  assert.equal(merged[1].growId, "g1");
  assert.equal(merged[1].hasMedia, false);
});
