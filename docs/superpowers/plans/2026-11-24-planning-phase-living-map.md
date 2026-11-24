# Planning Phase, Process Trail, and Living Mycelial Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people capture photos and short videos of their process (Planning phase + Academy steps) and watch a finished grow replay on the Mycelial Map as an interactive, mushroom-specific animation that ends with their real harvest photo.

**Architecture:** Everything stays in `grow-log.html`. Logic with no DOM (mushroom picking, video validation, replay planning, export extras) lives in clearly marked `// @pure:begin NAME` / `// @pure:end NAME` blocks so a tiny Node runner (`tests/run.mjs`) can evaluate and test them. DOM work extends the existing SVG map (`renderMap`, `mapUi`, `startReplay`) and Academy (`renderStep`). Media lives in IndexedDB (new `media` store).

**Tech Stack:** Plain HTML/CSS/JS, SVG, IndexedDB, Node 24 (tests only, no packages).

**Spec:** `docs/superpowers/specs/2026-11-24-planning-phase-living-map-design.md`

## Global Constraints

- Single file `grow-log.html`, no build step, no dependencies, no network.
- Export stays `{ app: "MycoQuest grow log", version: 2, grows, entries, recipes, academy }`; new data is extra optional keys only. **Videos never enter the v2 file**; an entry/capture carries `hasVideo: true`.
- Videos: max **15 seconds** and **25 MB** (`VIDEO_MAX_SECONDS = 15`, `VIDEO_MAX_BYTES = 25 * 1024 * 1024`). Photos and videos never gate a step, an XP claim, or a quest.
- XP curve unchanged (200 x block L1-45, 2,500 per level 46-49, cap 50 / 55,000 XP). Documentation XP = `DOC_XP = 10` per distinct step, once ever.
- Photos stay in IndexedDB db `mycoquest-grow-log-photos`; localStorage holds journal text only. User text is always rendered with `textContent` (never `innerHTML`).
- No plant imagery. Mushrooms spawn from substrate; they never fade/dissolve in. `🍄‍🟫` is feature-detected, fallback `🍄`.
- `prefers-reduced-motion`: no animation, final state shown, hover/tap/keyboard still work.
- All new interactive elements are keyboard focusable with accessible names.
- Commit after each task (owner has not yet said whether commits are wanted; ask once before Task 1 and follow the answer).

## Review Focus

- **Old data:** a journal saved before this change (no `trail`, no `planning`) loads and renders with no console errors (Task 2).
- **Oversize/overlong/unavailable media:** a 16 s clip, a 26 MB clip, or no IndexedDB shows a visible message and saves nothing (Tasks 2, 4).
- **Planning-only grow:** a grow with captures but zero check-ins (and one with zero of both) does not crash the map, stories, trophies, or replay (Tasks 3, 7).
- **Hostile text:** `<img onerror>` in a caption, observation, or `incidentNote` renders as text in popups and the replay (Task 7).
- **Compatibility:** an old v2 file imports unchanged; a new export contains no video bytes and no data URLs for videos; importing then exporting round-trips captions and `incidentNote` (Task 8).

---

### Task 1: Test harness for pure blocks

**Files:**
- Create: `tests/run.mjs`, `tests/pure.test.mjs`
- Modify: `grow-log.html` (add one empty marked block as a smoke target)

**Interfaces:**
- Produces: `loadPure(names: string[]): object` in `tests/run.mjs` — reads `grow-log.html`, extracts text between `// @pure:begin NAME` and `// @pure:end NAME`, evaluates the concatenation in `node:vm` with no DOM globals, returns the exported names (blocks end with `exports.X = X;` lines using a free `exports` object).

- [ ] **Step 1: Write failing test** `tests/pure.test.mjs`: `loadPure(["smoke"]).smokeOk === true` using `node:assert`; runner prints PASS/FAIL per test and exits non-zero on failure.
- [ ] **Step 2: Run** `node tests/run.mjs` — Expected: FAIL (block `smoke` missing).
- [ ] **Step 3: Implement** `loadPure` and add `// @pure:begin smoke` … `exports.smokeOk = true;` … `// @pure:end smoke` inside the existing `<script>`.
- [ ] **Step 4: Run** `node tests/run.mjs` — Expected: PASS. Also `node --check` is not applicable to HTML; verify the page still opens with no console errors.
- [ ] **Step 5: Commit** `test: node harness for pure blocks`.

### Task 2: Media store, video rules, and state shape

**Files:**
- Modify: `grow-log.html` (near `PHOTO_DB_NAME`, `emptyState`, `loadState`)
- Test: `tests/pure.test.mjs`

**Interfaces:**
- Produces (pure block `media-rules`): `VIDEO_MAX_SECONDS`, `VIDEO_MAX_BYTES`, `DOC_XP`, `validateVideo({ size: number, duration: number }): { ok: boolean, reason?: string }`, `documentationKey(questId: string, stepId: string): string` (`"quest:step"`).
- Produces (DOM side): `putMedia(id: string, value: Blob | string): Promise<void>`, `getMedia(id: string): Promise<Blob | string | undefined>`, `deleteMedia(id: string): Promise<void>` on a new object store `media` (bump DB version to 2; `onupgradeneeded` creates `media` only if absent and keeps `photos`).
- Produces: `state.trail: Capture[]`, `state.docAwards: Record<string, number>`; `Capture = { id, growId, questId?, stepId?, kind: "photo" | "video", caption, takenAt, note?, hasMedia: true }`. `loadState` defaults both when missing; version stays 3.

- [ ] **Step 1: Write failing tests** for `validateVideo`: `{size: 5e6, duration: 15}` ok; `{duration: 15.5}` → `ok:false`, reason mentions "15 seconds"; `{size: 25*1024*1024 + 1, duration: 10}` → `ok:false`, reason mentions "25 MB"; `{duration: NaN}` → `ok:false`; `documentationKey("popcorn","soak") === "popcorn:soak"`.
- [ ] **Step 2: Run** `node tests/run.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** the `media-rules` block, the media store functions, and the state defaults. IndexedDB failure rejects with a message surfaced via `$("#storage-note")`, never swallowed.
- [ ] **Step 4: Run** tests — Expected: PASS. Manual: load the page with an old saved journal (copy the existing localStorage value); no console errors, grows and map render.
- [ ] **Step 5: Commit** `feat: media store, video rules, trail state`.

### Task 3: Planning phase and Plan-this-grow

**Files:**
- Modify: `grow-log.html` — `#new-grow-form`, `handleNewGrow`, `growCard`, `renderGrowList`, `prepareCheckinForm`, `exportData`, `importPayload`, `trophyProgress`

**Interfaces:**
- Consumes: `state.trail` (Task 2).
- Produces: a grow may have `planning: true` and `startDate: ""`; `planningDetail?: { substrate?, waterRatio?, sterilizationMin?, notes? }` (only when "Log in full detail" is on). `startInoculation(growId: string, date: string): void` clears `planning` and sets `startDate`. Existing grows are unchanged.

- [ ] **Step 1: Behavior** — new-grow form gets a "Plan this grow first" checkbox that makes the inoculation date optional; a planning grow shows a "Planning" badge, a **Start inoculation** button (date picker, not future), and a "Log in full detail" toggle revealing the `planningDetail` fields. Everything else about the card is unchanged.
- [ ] **Step 2: Implement** `startInoculation` and the form/card changes. Guard every place that assumes `grow.startDate` is non-empty (`daysSince`, `storyFor`, `escapeDate` users, compare chart) — a planning grow must render a clear "Planning, not inoculated yet" instead of dates.
- [ ] **Step 3: Verify** manually: create a planning grow with no date → it appears, no console errors, map/stories/trophies unaffected; start inoculation → becomes a normal grow; reload keeps both.
- [ ] **Step 4: Commit** `feat: planning phase for grows`.

### Task 4: Capture slots in Academy steps

**Files:**
- Modify: `grow-log.html` — `renderStep` (append after the checklist/callouts), new `renderCaptureSlot`, `addCapture`, `removeCapture`

**Interfaces:**
- Consumes: Task 2 media store, `compressPhoto(file)`, `validateVideo`.
- Produces: `renderCaptureSlot(quest, step, ctx): HTMLElement`; `addCapture({ growId, questId, stepId, kind, file, caption }): Promise<Capture>`; `removeCapture(id: string): Promise<void>`; `capturesForStep(questId: string, stepId: string, growId?: string): Capture[]`; `awardDocumentation(questId: string, stepId: string): number` (returns XP awarded, `DOC_XP` first time per key, else 0; records in `state.docAwards`; never removed when a capture is deleted).

- [ ] **Step 1: Write failing test** (pure block `doc-xp`): `docXpFor(awards, key)` returns `DOC_XP` when `awards[key]` is absent and `0` when present; `totalDocXp(awards)` sums values.
- [ ] **Step 2: Run tests** — Expected: FAIL. Implement the block; Expected: PASS.
- [ ] **Step 3: Implement** the slot UI: "Add photo", "Add 10–15 s video" (`<input type="file" accept="image/*" capture>` / `video/*` with `capture`), caption field, thumbnails with remove. Video duration is read from a temporary `<video>` element via `loadedmetadata`, then `validateVideo`; on failure show the reason inline and save nothing. Slots work before a grow is linked (stored with `growId: null`, attached when the quest links a grow). Never disable step completion based on captures. Add `totalDocXp(state.docAwards)` into `totalXp()`.
- [ ] **Step 4: Verify** manually: popcorn quest → Soak step → add a photo and a 12 s video → thumbnails appear, +10 XP once (adding a second capture on the same step gives 0), reload keeps them; a 20 s clip is rejected with "15 seconds" text; deleting a capture keeps the XP.
- [ ] **Step 5: Commit** `feat: capture slots on academy steps`.

### Task 5: Mushroom, mycelium, and spore glyph library

**Files:**
- Modify: `grow-log.html` (new CSS block + `// @pure:begin mushrooms` block + DOM builders)
- Test: `tests/pure.test.mjs`

**Interfaces:**
- Produces (pure): `MUSHROOM_FAMILIES` (ids: `oyster, lionsmane, shiitake, reishi, kingoyster, chestnut, enoki, button, chanterelle, morel, turkeytail, agaric`; each `{ label, caps: string[] (hex colors, ≥3), sporePrint: string, formClass: string }`); `speciesFamily(species: string): string` (matches common/Latin names case-insensitively; unknown → `"button"`); `pickMushroom(species: string, seed: string): { family, capColor, sporeColor, scale, tilt, stemLen, count }` (deterministic per `(species, seed)`).
- Produces (DOM): `mushroomSprite(pick, form: "pin" | "young" | "mature"): SVGGElement` (custom inline-SVG glyphs, emoji-sized, one per family); `rhizomorph(rand, from, to): SVGGElement` (branching white-to-cream threads with fine fan-out hyphae); `sporeCloud(x, y, color): void` (particle drift in spore-print color).
- Hover/focus and click reactions per family implemented in CSS classes `.fx-<family>` (sway, spine shiver, gleam, sprout, pulse); `prefers-reduced-motion` disables them.

- [ ] **Step 1: Write failing tests:** `speciesFamily("Lion's mane") === "lionsmane"`, `("Blue oyster") === "oyster"`, `("Pleurotus ostreatus") === "oyster"`, `("Shiitake") === "shiitake"`, `("Unknownus fungus") === "button"`; `pickMushroom("Blue oyster","a")` deep-equals itself called twice; `pickMushroom("Blue oyster","a").capColor` is in `MUSHROOM_FAMILIES.oyster.caps`; across seeds `"a".."z"` at least 3 distinct `capColor`s appear; every family has `caps.length >= 3`.
- [ ] **Step 2: Run** — Expected: FAIL. Implement; Expected: PASS.
- [ ] **Step 3: Implement** the DOM builders and per-family CSS reactions. Add a temporary `?glyphs` URL view (removed in Task 9) that lays out every family in all three forms for a visual check.
- [ ] **Step 4: Verify** visually via `?glyphs`: all 12 families read clearly as different mushrooms, at 3 forms, in light/dark; hover and focus animate; reduced-motion (DevTools emulation) stops motion.
- [ ] **Step 5: Commit** `feat: mushroom glyph library with per-family reactions`.

### Task 6: Replay plan (pure)

**Files:**
- Modify: `grow-log.html` (`// @pure:begin replay` block)
- Test: `tests/pure.test.mjs`

**Interfaces:**
- Consumes: `speciesFamily`, `pickMushroom` (Task 5).
- Produces: `buildReplayPlan({ grow, entries, trail }): { durationMs: number, beats: Beat[] }` with `Beat = { t: number, kind: "prop" | "mycelium" | "pin" | "fruit" | "contam" | "heal" | "harvest", glyph: string, day: number, label: string, entryId?: string, captureId?: string, size?: number, pick?: object }`. Props use real emoji (`🌾 💧 🔥 🫙 💉 🧫 🧺 🌡️ 🏆 🦠 🪵`); mushrooms use `pick`. `t` is monotonic non-decreasing and ≤ `durationMs`.

Rules the tests pin: pacing scales with real elapsed days, clamped to `[12000, 40000]` ms; every `Possible contamination` entry yields a `contam` beat, followed by a `heal` beat at the next non-flagged entry; a `Harvest` entry with `flushNumber` and `freshYieldG` yields a `fruit` beat whose `size` increases with yield; entries and trail items sort by date/`takenAt`; a grow with no entries and no trail returns `{ durationMs: 0, beats: [] }`; a planning-only grow (trail only) yields `prop` beats only.

- [ ] **Step 1: Write failing tests** for each rule above, plus: two grows with different species/dates/yields produce different `beats` (not deep-equal), and `buildReplayPlan` never throws on entries with `null` temperature/humidity or missing `date` (those entries are skipped).
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3: Implement** the block. **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: pure replay plan builder`.

### Task 7: Living map — emoji beats, field-note popups, contamination note

**Files:**
- Modify: `grow-log.html` — `renderMap`, `mapUi`, `startReplay`, `stopReplay`, `applyMapReveal`, `showMapDetail`, `#checkin-form`, `handleCheckin`

**Interfaces:**
- Consumes: `buildReplayPlan`, `mushroomSprite`, `rhizomorph`, `sporeCloud`, `getMedia`, `capturesForStep`.
- Produces: `openFieldNote(node: MapNode): void` and `closeFieldNote(): void`; each `MapNode` gains `beat: Beat`; entries gain optional `incidentNote: string` (max 500 chars) captured by a new textarea "What happened and why do you think so?" shown in the check-in form only when appearance is `Possible contamination` or `Needs attention`.
- Branches now exist for grows with entries **or** trail captures. The existing `mushroomGlyph` calls are replaced by `mushroomSprite`; existing node tap, timeline slider, and `showMapDetail` keep working.

- [ ] **Step 1: Behavior** — replay drives off `buildReplayPlan`: props pop in at their beats, `rhizomorph` threads spread, pins push up out of the substrate node (squash-and-stretch pop, then `sporeCloud` in the species' spore-print color), contamination `🦠` patches appear then get cut back. Every emoji/glyph is focusable (`role="button"`, name like "Fruiting, day 19, open field note"), animates on hover/focus, and on click/Enter/Space plays its reaction and opens the popup.
- [ ] **Step 2: Popup** (anchored to the node, Esc/click-away/Close dismiss, focus returns to the node): user photo (or video poster with play, loaded via `getMedia` and revoked on close), stage, day number and date, temperature/humidity if logged, observation. For `contam`/`Possible contamination`: the `incidentNote` in a supportive frame ("What you noticed"). All text via `textContent`.
- [ ] **Step 3: Density cap** — more than 120 nodes collapses older ones into cluster glyphs showing a count; replay stays under 60 SVG animations at once.
- [ ] **Step 4: Verify** manually with the sample journal (Task 10 may be needed first; otherwise create two grows): replay plays, every emoji reacts on hover and click, a contamination popup shows the note, a caption containing `<img src=x onerror=alert(1)>` shows as text, a planning-only grow does not break the map, reduced-motion shows the final state with working taps, keyboard Tab/Enter/Esc work, mobile width 375 px is usable.
- [ ] **Step 5: Commit** `feat: living map with interactive emoji beats and field notes`.

### Task 8: Export / import extras and media backup

**Files:**
- Modify: `grow-log.html` — `exportData`, `importPayload`, Backup section UI
- Test: `tests/pure.test.mjs`

**Interfaces:**
- Produces (pure block `export-extras`): `trailForExport(trail: Capture[]): object[]` → each item `{ id, growName, species, questId, stepId, kind, caption, takenAt, hasVideo: boolean }` (no media bytes); `entryExtras(entry): { incidentNote?: string }`; `mergeTrail(existing: Capture[], incoming: object[], growIdByKey: (name, species) => string | null): Capture[]` (de-duplicates by `id`, drops items whose grow cannot be resolved).
- Produces (DOM): `exportMediaBackup(): Promise<void>` (separate file `MycoQuest-media-<date>.json`, `{ app: "MycoQuest media backup", version: 1, items: [{ id, kind, dataUrl }] }`) and `importMediaBackup(file: File): Promise<number>` (returns items restored).
- `exportData` adds `trail` and per-entry `incidentNote`, grows add `planning`; **no existing key is renamed or removed**.

- [ ] **Step 1: Write failing tests:** `trailForExport` output contains no key named `dataUrl`/`blob` and sets `hasVideo` only for videos; `mergeTrail` adding the same `id` twice yields one item; unknown grow is dropped.
- [ ] **Step 2: Run** — Expected: FAIL. Implement; Expected: PASS.
- [ ] **Step 3: Implement** DOM wiring. Photos in captures are included inline in the main export only if under `PHOTO_MAX_DATA_URL_LENGTH`; otherwise they ride in the media backup.
- [ ] **Step 4: Verify** manually: export → file has `version: 2` and `recipes: []`; delete everything, import → captions, `incidentNote`, planning grows return; media backup restores video thumbnails; import an old v2 file from the repo history unchanged.
- [ ] **Step 5: Commit** `feat: v2-compatible export extras and media backup`.

### Task 9: Replay controller and Grow Reel finale

**Files:**
- Modify: `grow-log.html` — replay controls near `#map-replay`, `startReplay`, grow card (**Replay my grow** button); remove the temporary `?glyphs` view from Task 5

**Interfaces:**
- Consumes: `buildReplayPlan`, `getMedia`, `mushroomSprite`.
- Produces: `replayController = { play(): void, pause(): void, seek(ms: number): void, setSpeed(x: 0.5 | 1 | 2): void, state: "idle" | "playing" | "paused" | "done" }`; `renderFinale(growId: string): Promise<void>`; `saveReelStill(growId: string): Promise<void>` (local canvas render to PNG download).

- [ ] **Step 1: Behavior** — controls: play/pause, scrub, 0.5×/1×/2×, replay; replaying one grow isolates its branch. The finale: the drawn mushrooms spawn up around the substrate node, then the user's real harvest photo **grows up out of the substrate in a cap-shaped frame** (scale from the substrate point, spore puff on completion). No harvest photo: the replay ends on the drawn cluster with an "Add your harvest photo" prompt.
- [ ] **Step 2: Implement** the controller (one `requestAnimationFrame` clock, no per-emoji intervals) and the finale; `saveReelStill` draws the final frame to `<canvas>` and downloads a PNG.
- [ ] **Step 3: Verify** manually: replay, pause, scrub back/forward, 2× speed, finale shows the harvest photo emerging; reduced-motion jumps to the final frame; Save-as-image downloads a non-empty PNG; no console errors.
- [ ] **Step 4: Commit** `feat: replay controller and Grow Reel finale`.

### Task 10: Documented trophy, sample journal, docs

**Files:**
- Modify: `grow-log.html` — `TROPHIES`, `trophyProgress`, `buildSampleJournal`; `HANDOFF.md`, `README.md`

**Interfaces:**
- Consumes: `state.docAwards`, `state.trail`.
- Produces: trophy `["documented", "Documented", "◈", 150, "Document 5 steps with a photo or video"]` with progress `[Math.min(Object.keys(state.docAwards).length, 5), 5]`; `buildSampleJournal` adds a plan trail (photos generated on a `<canvas>`, one short generated clip is not required), one contamination entry with an `incidentNote`, and a harvest with a generated harvest image so the replay and finale are previewable. It stays flagged `state.sample` and never overwrites real data.

- [ ] **Step 1: Implement** the trophy and sample additions; `updateTrophyUnlocks` awards it once.
- [ ] **Step 2: Update** `HANDOFF.md` (decisions: media store, 15 s / 25 MB, v2 extras, replay plan, glyph library, `tests/run.mjs`) and `README.md` features.
- [ ] **Step 3: Verify** end to end with a clean browser profile: "Try a sample journal" → Map → replay → tap emoji → contamination popup → harvest finale; clear sample; start a real planning grow, follow the popcorn quest with captures; run `node tests/run.mjs` — Expected: all PASS.
- [ ] **Step 4: Commit** `feat: documented trophy, sample journal, docs`.

---

## Self-review

- **Spec coverage:** Planning phase (T3), capture slots + video rules (T2, T4), full-detail logging (T3), glyph variety/mycelium/spores/reactions (T5), data-driven replay (T6), popups + contamination note + spawning (T7), v2-safe export + media backup (T8), controller + finale + save-as-image (T9), trophy/sample/docs (T10). Non-goals (no recognition, no server, no video editor) are respected.
- **Types:** `Capture`, `Beat`, `MapNode`, `pickMushroom` result and function names are defined once and reused unchanged in later tasks.
- **Proportion:** logic with tricky correctness is specified as tests; UI tasks specify behavior and a manual check because the repo has no browser test runner.
