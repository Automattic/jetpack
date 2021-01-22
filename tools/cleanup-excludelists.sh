#!/bin/bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..

TMPDIR="${TMPDIR:-/tmp}"
TEMP=$(mktemp "${TMPDIR%/}/cleanup-excludelists-XXXXXXXX")
if [[ ! -e "$TEMP" ]]; then
	exit 1
fi
trap "rm \"$TEMP\"" EXIT

: > "$TEMP"
yarn lint-file --max-warnings=0 --format=json --output-file="$TEMP" --ignore-path=<(echo '*.js'; echo '*.jsx'; jq -r '"!/" + .[]' tools/eslint-excludelist.json) . || true
[[ -s "$TEMP" ]] && jq -e '.' < "$TEMP" >/dev/null || { echo "No JSON data found"; cat "$TEMP"; exit 1; }
jq -r --arg pwd "$PWD/" '[ .[] | select( .messages[0] ) | .filePath | ltrimstr($pwd) ] | sort' "$TEMP" | tools/prettier --parser=json > tools/eslint-excludelist.json

: > "$TEMP"
composer phpcs:lint -- -m --file-list=<(for f in $(jq -r '.[]' tools/phpcs-excludelist.json); do [[ -e "$f" ]] && echo $f; done) --report=json --report-file="$TEMP" || true
[[ -s "$TEMP" ]] && jq -e '.' < "$TEMP" >/dev/null || { echo "No JSON data found"; cat "$TEMP"; exit 1; }
jq -r --arg pwd "$PWD/" '[ .files | to_entries | .[] | select( .value.errors > 0 or .value.warnings > 0 ) | .key | ltrimstr($pwd) ] | sort' "$TEMP" | tools/prettier --parser=json > tools/phpcs-excludelist.json

git diff tools/eslint-excludelist.json tools/phpcs-excludelist.json
