# MycoQuest Grow Log

A standalone mushroom grow journal built as a plain HTML/CSS/JS single-file app.

**Live demo:** https://jefeh-create.github.io/mycoquest-grow-log/ (choose "Try a sample journal" to see a month of growing).

## Run locally

Open `grow-log.html` in a browser, or serve the folder with a simple local server:

```bash
python -m http.server 8765
```

Then visit:

```text
http://127.0.0.1:8765/grow-log.html
```

## Features

- Tabbed layout with one clear first action; the map and stories unfold once you add a grow
- Leveling and XP progress
- First Grow Academy: guided BRF cake, popcorn grain spawn, and fruiting quests with timers, a jar calculator, and XP verified by real check-ins
- Living mycelial map: organic hyphae per grow, nutrient-flow animation, growth replay, and spore bursts
- Ten mushroom trophies earned from real grow data (rarities Spore, Pin, Cap, Flush, Legend), each a medallion with its own mushroom, a progress ring while locked, and a full unlock celebration where the medallion spawns from the soil; a shelf summary with filters and "next up"; Master Mycologist for collecting them all
- Mushroom ranks (Spore to Archmycologist) with level-up and Academy quest-complete celebrations
- Planning phase: plan a grow before inoculating, log grain/substrate details, and capture photos or 15 s videos on every Academy step
- Living mycelial map: every grow is on it from planning to harvest, with stage filters, tap-to-open field notes, contamination notes, a paced replay (play/pause/scrub/speed), and a harvest-photo finale
- Optional media backup file for process-trail photos and videos
- Daily check-ins with temperature, humidity, and appearance
- Stage-based progress tracking
- Mycelial map, auto-written stories, streaks, and trophies
- Backup and import/export in the storefront-compatible v2 format

## Notes

- Data is stored in `localStorage` in the browser.
- Export a backup before clearing browser data.
