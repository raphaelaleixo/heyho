#!/usr/bin/env bash
# Screenshots assets/og.html into the 1200×630 social card.
# Re-run after changing og.html or the sheet previews.
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }

OUT="$(pwd)/assets/og.png"
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --force-device-scale-factor=1 --screenshot="$OUT" \
  --virtual-time-budget=4000 \
  "file://$(pwd)/assets/og.html"

echo "Wrote $OUT"
