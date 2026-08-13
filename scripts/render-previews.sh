#!/usr/bin/env bash
# Renders every page of the sheet to assets/page-N.png so the previews on the
# page can never drift from the file people actually download.
# Re-run after replacing assets/heyho-en.pdf.
set -euo pipefail

PDF="${1:-assets/heyho-en.pdf}"
OUT_DIR="${2:-assets}"

if [ ! -f "$PDF" ]; then
  echo "No PDF at $PDF" >&2
  exit 1
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "pdftoppm not found. Install it with: brew install poppler" >&2
  exit 1
fi

rm -f "$OUT_DIR"/page-*.png
pdftoppm -png -r 110 -aa yes -aaVector yes "$PDF" "$OUT_DIR/page"

ls -1 "$OUT_DIR"/page-*.png
