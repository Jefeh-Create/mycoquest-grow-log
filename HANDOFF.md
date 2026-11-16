# MycoQuest Grow Log: handoff

Single-file app (grow-log.html), plain HTML/CSS/JS, localStorage only.

## Decisions
- XP curve: 200 x block for levels 1-45, 2,500 per level 46-49, cap 50 (55,000 XP)
- Daily check-ins award XP automatically (10 XP per grow per day, plus streak bonus)
- Grow stage and recipe posts still use the pending/approve/reject flow
- Export format: { app: "MycoQuest grow log", version: 2, entries, recipes }
  must stay importable by the storefront demo

## Next up
- [ ] Move `const $` above `let state = load()` (crash on bad saved data)
- [x] Mycelial Map (SVG, one branch per grow, nodes colored by stage)
- [x] Grow Story (auto-written summary per grow)
- [x] Streaks and trophies
- [ ] Hash links: #grows, #map, #story

## Don't break
- v2 import/export compatibility
