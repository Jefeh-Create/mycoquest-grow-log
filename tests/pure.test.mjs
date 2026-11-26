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
test("cleanTrim keeps a valid range and rounds to tenths", () => {
  const { cleanTrim } = loadPure(["export-extras"]);
  assert.equal(JSON.stringify(cleanTrim({ start: 1.234, end: 6.78 })), JSON.stringify({ start: 1.2, end: 6.8 }));
  assert.equal(JSON.stringify(cleanTrim({ start: 2, end: 9 }, 8)), JSON.stringify({ start: 2, end: 8 }));
});
test("cleanTrim drops ranges that are empty, reversed, too short, or not numbers", () => {
  const { cleanTrim } = loadPure(["export-extras"]);
  assert.equal(cleanTrim(null), null);
  assert.equal(cleanTrim({ start: 5, end: 3 }), null);
  assert.equal(cleanTrim({ start: 2, end: 2.2 }), null);
  assert.equal(cleanTrim({ start: "a", end: 4 }), null);
  assert.equal(cleanTrim({ start: -1, end: 4 }).start, 0);
  assert.equal(cleanTrim({ start: 0, end: 15 }, 15), null, "a range covering the whole clip is no trim");
});
test("trailForExport and mergeTrail carry a video trim but not a photo trim", () => {
  const { trailForExport, mergeTrail } = loadPure(["export-extras"]);
  const out = trailForExport([
    { id: "v", growId: "g1", kind: "video", trim: { start: 1, end: 4 } },
    { id: "p", growId: "g1", kind: "photo", trim: { start: 1, end: 4 } }
  ], () => ({ name: "Batch", species: "Oyster" }));
  assert.equal(JSON.stringify(out[0].trim), JSON.stringify({ start: 1, end: 4 }));
  assert.equal("trim" in out[1], false);
  const merged = mergeTrail([], out, () => "g1");
  assert.equal(JSON.stringify(merged[0].trim), JSON.stringify({ start: 1, end: 4 }));
  assert.equal("trim" in merged[1], false);
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

test("replayTimes returns nothing for no items", () => {
  const { replayTimes } = loadPure(["replay-time"]);
  const out = replayTimes([]);
  assert.equal(out.durationMs, 0);
  assert.equal(out.times.length, 0);
});
test("replayTimes keeps same-day items apart and the replay at least 12 s", () => {
  const { replayTimes } = loadPure(["replay-time"]);
  const day = Date.parse("2026-11-01T12:00:00");
  const out = replayTimes([{ ms: day }, { ms: day }, { ms: day }]);
  assert.ok(out.durationMs >= 12000);
  for (let i = 1; i < out.times.length; i += 1) assert.ok(out.times[i] - out.times[i - 1] >= 250, "gap at " + i);
});
test("replayTimes paces by real elapsed days and clamps to 40 s", () => {
  const { replayTimes } = loadPure(["replay-time"]);
  const d0 = Date.parse("2026-11-01T12:00:00"), DAY = 864e5;
  const out = replayTimes([{ ms: d0 }, { ms: d0 + DAY }, { ms: d0 + 10 * DAY }]);
  const gapShort = out.times[1] - out.times[0], gapLong = out.times[2] - out.times[1];
  assert.ok(gapLong > gapShort * 5, "10 real days should take much longer than 1 on screen");
  const long = replayTimes([{ ms: d0 }, { ms: d0 + 400 * DAY }]);
  assert.ok(long.durationMs <= 40000, "duration " + long.durationMs);
});
test("replayTimes treats undated items as the start", () => {
  const { replayTimes } = loadPure(["replay-time"]);
  const d0 = Date.parse("2026-11-01T12:00:00");
  const out = replayTimes([{ ms: null }, { ms: d0 }, { ms: d0 + 5 * 864e5 }]);
  assert.ok(out.times[0] <= out.times[1] && out.times[1] < out.times[2]);
});
test("parseMediaBackup rejects other files and filters unsafe items", () => {
  const { parseMediaBackup } = loadPure(["media-backup"]);
  assert.equal(parseMediaBackup({ app: "something else", version: 1, items: [] }).ok, false);
  assert.equal(parseMediaBackup(null).ok, false);
  const good = { id: "c1", kind: "photo", dataUrl: "data:image/png;base64,AAAA" };
  const video = { id: "c2", kind: "video", dataUrl: "data:video/webm;base64,AAAA" };
  const result = parseMediaBackup({ app: "MycoQuest media backup", version: 1, items: [
    good, video,
    { id: "c3", kind: "photo", dataUrl: "data:video/webm;base64,AAAA" },
    { id: "c4", kind: "photo", dataUrl: "javascript:alert(1)" },
    { kind: "photo", dataUrl: "data:image/png;base64,AAAA" }
  ] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map((item) => item.id), ["c1", "c2"]);
});

test("rarityFor ranks trophies by XP with mushroom names", () => {
  const { rarityFor } = loadPure(["rewards"]);
  const name = (xp) => rarityFor(xp).name;
  assert.equal(name(50), "Spore");
  assert.equal(name(100), "Spore");
  assert.equal(name(150), "Pin");
  assert.equal(name(200), "Cap");
  assert.equal(name(250), "Cap");
  assert.equal(name(300), "Flush");
  assert.equal(name(500), "Legend");
  assert.match(rarityFor(500).color, /^#/);
});
test("rankForLevel gives each level band a mushroom rank", () => {
  const { rankForLevel } = loadPure(["rewards"]);
  const at = (level) => rankForLevel(level).title;
  assert.equal(at(1), "Spore");
  assert.equal(at(4), "Spore");
  assert.equal(at(5), "Pinhead");
  assert.equal(at(10), "Button");
  assert.equal(at(15), "Fruiting Body");
  assert.equal(at(25), "Flush Master");
  assert.equal(at(35), "Mycelial Elder");
  assert.equal(at(45), "Forest Sage");
  assert.equal(at(50), "Archmycologist");
  assert.equal(at(0), "Spore");
});
test("nextUpTrophy picks the closest unfinished trophy and skips collected ones", () => {
  const { nextUpTrophy } = loadPure(["rewards"]);
  const progress = { a: [3, 7], b: [6, 7], c: [7, 7], d: [0, 5] };
  assert.equal(nextUpTrophy(["a", "b", "c", "d"], progress, { c: "x" }), "b");
  assert.equal(nextUpTrophy(["a", "d"], progress, {}), "a");
  assert.equal(nextUpTrophy(["c"], progress, { c: "x" }), null);
});
test("celebrationPlan batches large unlock bursts into one summary", () => {
  const { celebrationPlan } = loadPure(["rewards"]);
  assert.equal(celebrationPlan(["a"]).mode, "single");
  assert.equal(celebrationPlan(["a", "b"]).mode, "single");
  const burst = celebrationPlan(["a", "b", "c", "d"]);
  assert.equal(burst.mode, "summary");
  assert.equal(burst.ids.length, 4);
  assert.equal(celebrationPlan([]).mode, "none");
});
