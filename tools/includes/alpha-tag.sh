#!/usr/bin/env bash

## Determine the alpha prerelease tag, "alpha" or "a.0".
#
# $1 - Path to Changelogger.
# $2 - Path to composer.json.
# $3 - 0 or 1, depending on whether the result should be even or odd.
function alpha_tag {
	local PRERELEASE=alpha
	if jq -e '.extra["dev-releases"]' "$2" > /dev/null; then
		local N="$("$1" version current --default-first-version | sed -E -n -e 's/^.*-a\.([0-9]+)$/\1/p')"
		if [[ -z "$N" ]]; then
			N=0
		else
			N=$(( N + 1 ))
		fi
		if [[ $(( N & 1 )) -ne $3 ]]; then
			N=$(( N + 1 ))
		fi
		echo "a.$N"
	else
		echo 'alpha'
	fi
}
