#!/bin/bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"

TESTAGE=$1
if ! [[ "$TESTAGE" =~ ^[0-9][0-9]*$ ]]; then
	echo "USAGE: $0 <age-in-days>" >&2
	exit 1
fi

shopt -s nullglob

for p in projects/*/*/composer.json; do
	SLUG=${p#projects/}
	SLUG=${SLUG%/composer.json}

	TS=$EPOCHSECONDS
	OLDEST=
	for CE in projects/$SLUG/changelog/*; do
		FTS=$(git log -1 --format='%ct' "$CE")
		if [[ -n "$FTS" && $FTS -lt $TS ]]; then
			TS=$FTS
			OLDEST=${CE##*/}
		fi
	done

	AGE=$(( ( $EPOCHSECONDS - $TS ) / 86400 ))
	if [[ $AGE -ge $TESTAGE ]]; then
		echo "* $SLUG has change entries from $AGE days ago (e.g. $OLDEST)"
	fi
done
