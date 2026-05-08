#!/bin/bash
set -euo pipefail

VERSION=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' manifest.json | sed -E 's/.*"([^"]+)"$/\1/')
if [[ -z "$VERSION" ]]; then
  echo "Could not read version from manifest.json" >&2
  exit 1
fi

OUT="copy-hyperlink-${VERSION}.zip"
rm -f "$OUT"

zip -r "$OUT" . \
  -x ".git/*" ".gitignore" ".vscode/*" "*.DS_Store" "build.sh" "README.md" "CLAUDE.md" "*.zip"

echo "Built $OUT"
# Open https://chrome.google.com/webstore/devconsole → New Item → Upload zip
