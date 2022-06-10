#!/bin/bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
. tools/includes/chalk-lite.sh

TMPDIR="${TMPDIR:-/tmp}"
TEMP=$(mktemp "${TMPDIR%/}/cleanup-excludelists-XXXXXXXX")
if [[ ! -e "$TEMP" ]]; then
	exit 1
fi
trap "rm \"$TEMP\"" EXIT

: > "$TEMP"
pnpm run lint-file --max-warnings=0 --format=json --output-file="$TEMP" $(for f in $(jq -r '.[]' tools/eslint-excludelist.json); do [[ -e "$f" ]] && echo $f; done) || true
[[ -s "$TEMP" ]] && jq -e '.' < "$TEMP" >/dev/null || die "No JSON data found"
jq --tab -r --arg pwd "$PWD/" '[ .[] | select( .messages[0] ) | .filePath | ltrimstr($pwd) ] | sort' "$TEMP" > tools/eslint-excludelist.json

: > "$TEMP"
composer phpcs:lint -- -m --file-list=<(for f in $(jq -r '.[]' tools/phpcs-excludelist.json); do [[ -e "$f" ]] && echo $f; done) --report=json --report-file="$TEMP" || true
[[ -s "$TEMP" ]] && jq -e '.' < "$TEMP" >/dev/null || die "No JSON data found"
jq --tab -r --arg pwd "$PWD/" '[ .files | to_entries | .[] | select( .value.errors > 0 or .value.warnings > 0 ) | .key | ltrimstr($pwd) ] | sort' "$TEMP" > tools/phpcs-excludelist.json

git diff tools/eslint-excludelist.json tools/phpcs-excludelist.json
