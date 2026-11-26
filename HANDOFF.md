# MycoQuest Grow Log: handoff

Single-file app (grow-log.html), plain HTML/CSS/JS, localStorage only.

## Decisions
- XP curve: 200 x block for levels 1-45, 2,000 per level 46-49, cap 50 (53,000 XP). Same as the storefront demo.
- Daily check-ins award XP automatically (10 XP per grow per day, plus streak bonus)
- Grow stage and recipe posts still use the pending/approve/reject flow
- Export format: { app: "MycoQuest grow log", version: 2, entries, recipes }
  must stay importable by the storefront demo
- Photos are stored in IndexedDB (`mycoquest-grow-log-photos`), keyed by entry id;
  localStorage holds only journal text. Exports still include photos inline.
- First Grow Academy (`#academy`): quests defined in the `QUESTS` array (BRF cakes, popcorn spawn,
  fruiting). No external video links.
  Prep steps = self-ticked checklists (small XP). Milestones verify against the linked grow's
  check-ins (`verifyRules`) before XP can be claimed. Academy XP counts toward the main level.
  Stored in `state.academy`; exported as an extra `academy` key and restored on import
  (linked grow re-resolved by name + species).

- Trophies: 8 rules in `TROPHIES` (id, title, icon, xp, rule) computed by `trophyProgress()`.
  Unlock dates persist in `state.trophies`; trophy XP counts toward the level.
- Mycelial map: seeded organic hyphae per grow, density of background filaments grows with
  check-ins, nutrient pulses (SVG animateMotion), "Replay growth", spore bursts on tap,
  auto-fit viewBox. All motion is disabled under prefers-reduced-motion.
- Sample journal: `buildSampleJournal()` (3 grows, 22 check-ins, academy progress) is offered
  only while the journal is empty (`journalIsEmpty()`), flagged with `state.sample`, and cleared
  with the banner button. It can never overwrite real data.

## Planning phase / process trail / living map / trophies
Spec: `docs/superpowers/specs/2026-11-24-planning-phase-living-map-design.md`; plan: `docs/superpowers/plans/2026-11-24-planning-phase-living-map.md`.
- Done: Planning phase (`grow.planning`, "Plan this grow first", Start inoculation, full-detail panel);
  Academy capture slots (photo / 15 s video, IndexedDB `media` store, `state.trail`, +10 XP once per step in `state.docAwards`);
  12-family SVG mushroom glyphs + rhizomorph + spore clouds + hover/tap reactions on the map;
  contamination 🦠 node and `incidentNote` field/popup; v2 export extras (`trail`, `incidentNote`, `planning`, `docAwards`; no media bytes).
- Also done: every grow is on the map (planning-only too) with seed + capture nodes; stage chips/stat tiles; harvest-photo finale;
  replay paced by real elapsed days (`replayTimes`, 12-40 s) with play/pause/scrub/0.5x-1x-2x; "Documented" trophy (5 documented steps);
  sample journal ships a 5-step process trail with generated photos; separate media backup file
  (`MycoQuest media backup` v1: export/import photos and videos, import the journal first, then the media).
- Trophies/rewards: ten trophies (incl. Documented and Master Mycologist) drawn as mushroom trophies (`trophyFigure`: cap = cup, mycelium handles,
  plinth with progress bar, hand-drawn pin/hypha emblem per trophy via `emblemMarkup`); rarities Spore/Pin/Cap/Flush/Legend by XP (pure `rewards` block);
  unlock celebration dialog queue (`celebrate`, spawns from soil, XP count-up, >2 unlocks collapse to a summary); shelf summary, filters, next-up card,
  detail dialog with "Replay unlock"; mushroom ranks by level (`RANKS`, level-up + quest-complete celebrations). Round `medallion()` is only used for ranks.
- Fixed (2026-11-26):
  - The finale label sits on its own pill below the side mushrooms.
  - Trophy and celebration pop-ups scroll and shrink on screens under 420px wide or 640px tall.
  - Each capture has a "Grow" picker that moves it to another grow, or to no grow (`moveCapture`).
  - Videos have "Trim video": a saved play range `capture.trim = {start, end}`, cleaned by the pure `cleanTrim`. The
    original clip is never changed, so "Use full clip" undoes it. The trim travels in v2 exports and imports.
  - The XP note above said 55,000; the code (and the storefront) have always used 53,000. Note corrected.
- Phone checks: `PHONE=320x568 node tests/dom.mjs tests/dom/phone-popups.js` (also `phone-celebrate.js`).
- Tests: `node tests/run.mjs` (pure logic), `sh tests/smoke.sh` (console errors), `node tests/dom.mjs tests/dom/<scenario>.js` (real UI in headless Chrome).

## Languages (added 2026-11-26)
- English (default) and Español, chosen in the header. It works the same way as the MycoQuest shop and shares its runtime.
  See `i18n/README.md`.
- Spanish has all 842 strings. `es.js` `meta.review` flags 29 lines for review:
  - pressure-cooker and sterilization safety;
  - contamination handling;
  - temperatures and humidity;
  - the jar calculator note;
  - some rank and trophy names.
  A fluent speaker and a grower should review all of it before relying on it.
- Hmong (`hmn.js`) is structure only, switched off, with no machine translation.
- The language is stored under `mycoquest-language`, apart from the journal. Saved stages and appearances stay in
  English, so data and v2 backups never change with the language.
- Pure blocks keep English `reason` text for the tests and add `reasonKey`/`vars` for what the page shows (`why()`).
- Checks: `node tools/check-translations.mjs` and `node tests/dom.mjs tests/dom/i18n.js` (also with `PHONE=320x568`).

## Next up
- [x] Move `const $` above `let state = load()` (crash on bad saved data)
- [x] Mycelial Map (SVG, one branch per grow, nodes colored by stage)
- [x] Grow Story (auto-written summary per grow)
- [x] Streaks and trophies
- [x] Hash links: #grows, #academy, #map, #stories, #trophies (plain anchors)

## Don't break
- v2 import/export compatibility
