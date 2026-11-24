#!/bin/sh
# Loads grow-log.html in headless Chrome and fails if the page logs a console error.
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
URL="file:///$(pwd -W 2>/dev/null || pwd)/grow-log.html${1:-}"
OUT=$("$CHROME" --headless=new --disable-gpu --enable-logging=stderr --v=0 --virtual-time-budget=4000 --dump-dom "$URL" 2>&1 >/dev/null)
echo "$OUT" | grep -i "CONSOLE" | grep -iv "favicon" && { echo "SMOKE FAIL"; exit 1; }
echo "SMOKE OK"
