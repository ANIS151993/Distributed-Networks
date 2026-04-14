#!/usr/bin/env bash

set -euo pipefail

NODE_BIN="${NODE_BIN:-node}"

if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  echo "Node.js is required to run this syntax check."
  echo "Set NODE_BIN=/absolute/path/to/node if node is installed under a different name."
  exit 1
fi

echo "Checking docs/script.js"
"$NODE_BIN" --check docs/script.js

echo "JavaScript syntax check passed."
