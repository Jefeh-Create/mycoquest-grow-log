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
- Daily check-ins with temperature, humidity, and appearance
- Stage-based progress tracking
- Mycelial map, auto-written stories, streaks, and trophies
- Backup and import/export in the storefront-compatible v2 format

## Notes

- Data is stored in `localStorage` in the browser.
- Export a backup before clearing browser data.
