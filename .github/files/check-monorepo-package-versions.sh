#!/bin/bash

set -eo pipefail

PACKAGES=$(jq -nc 'reduce inputs as $in ([]; . + [ $in.name ])' ./packages/*/composer.json)

EXIT=0
for FILE in $(git ls-files 'composer.json' '**/composer.json'); do
	for PKG in $(jq --argjson packages "$PACKAGES" '.require // {}, .["require-dev"] // {} | to_entries | .[] | select( .value != "@dev" and ( [ .key ] | inside( $packages ) ) ) | .key' "$FILE"); do
		EXIT=1
		LINE=$(grep --line-number --fixed-strings --max-count=1 "$PKG" "$FILE")
		if [[ -n "$LINE" ]]; then
			echo "::error file=$FILE,line=${LINE%%:*}:: Must depend on monorepo package $PKG version \"@dev\""
		else
			echo "::error file=$FILE:: Must depend on monorepo package $PKG version \"@dev\""
		fi
	done
done
exit $EXIT
