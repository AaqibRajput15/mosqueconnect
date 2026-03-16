#!/usr/bin/env bash
set -euo pipefail

if rg -n "^(<<<<<<<|=======|>>>>>>>)" . --glob '!node_modules/**' --glob '!.next/**' --glob '!.git/**'; then
  echo "\nUnresolved merge conflict markers were found."
  exit 1
fi

echo "No unresolved merge conflict markers found."
