#!/bin/bash

set -eo pipefail

PACKAGES=$(jq -nc 'reduce inputs as $in ({}; .[$in.name] |= ( $in.extra["branch-alias"]["dev-monorepo"] // "@dev" ) )' ./projects/packages/*/composer.json)

EXIT=0
for FILE in $(git ls-files 'composer.json' '**/composer.json'); do
	while IFS=" " read -r PKG VER; do
		EXIT=1
		LINE=$(grep --line-number --fixed-strings --max-count=1 "$PKG" "$FILE")
		if [[ -n "$LINE" ]]; then
			echo "::error file=$FILE,line=${LINE%%:*}:: Must depend on monorepo package $PKG version \"$VER\""
		else
			echo "::error file=$FILE:: Must depend on monorepo package $PKG version \"$VER\""
		fi
	done < <( jq --argjson packages "$PACKAGES" -r '.require // {}, .["require-dev"] // {} | to_entries[] | select( ( $packages[.key] // .value ) != .value ) | .key + " " + $packages[.key]' "$FILE" )
done
exit $EXIT
