#!/bin/bash

zip -r copy-hyperlink-0.x.zip . \
  -x ".git/*" ".vscode/*" "*.DS_Store" "build.sh" "README.md" "*.zip"

# Open https://chrome.google.com/webstore/devconsole → New Item → Upload zip