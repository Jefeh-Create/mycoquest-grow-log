# MycoQuest Grow Log

A standalone mushroom grow journal built as a plain HTML/CSS/JS single-file app.

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

- Leveling and XP progress
- First Grow Academy: guided BRF cake, popcorn grain spawn, and fruiting quests with timers, a jar calculator, and XP verified by real check-ins
- Living mycelial map: organic hyphae per grow, nutrient-flow animation, growth replay, and spore bursts
- Nine trophies earned from real grow data, including Documented
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
