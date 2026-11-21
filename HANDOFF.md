# MycoQuest Grow Log: handoff

Single-file app (grow-log.html), plain HTML/CSS/JS, localStorage only.

## Decisions
- XP curve: 200 x block for levels 1-45, 2,500 per level 46-49, cap 50 (55,000 XP)
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

## Next up
- [x] Move `const $` above `let state = load()` (crash on bad saved data)
- [x] Mycelial Map (SVG, one branch per grow, nodes colored by stage)
- [x] Grow Story (auto-written summary per grow)
- [x] Streaks and trophies
- [x] Hash links: #grows, #academy, #map, #stories, #trophies (plain anchors)

## Don't break
- v2 import/export compatibility
