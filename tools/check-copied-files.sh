#!/bin/bash

set -eo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
. tools/includes/chalk-lite.sh

EXIT=0
JQWARNED=false

# Compare two files, with optional delimiters.
# $1 - First file.
# $2 - Second file.
# $3 - (optional) Starting delimiter. If empty, comparison starts at the start of the files.
# $4 - (optional) Ending delimiter. If empty, comparison runs to the end of the files.
compare () {
	local FAIL=
	local F D
	for F in "$1" "$2"; do
		for D in "$3" "$4"; do
			if [[ -n "$D" ]] && ! grep -q "$D" "$F"; then
				[[ -z "$FAIL" ]] && printf '\n'
				if [[ -n "$CI" ]]; then
					printf '::error file=%s::' "$F"
				fi
				error "Did not find delimiter \`$D\` in $F."
				FAIL=1
			fi
		done
	done
	if [[ -n "$FAIL" ]]; then
		EXIT=1
		return
	fi

	local LA LB
	if [[ -n "$CI" && -n "$3" ]]; then
		LA=$(grep --line-number --max-count=1 "$3" "$1")
		LB=$(grep --line-number --max-count=1 "$3" "$2")
	else
		LA=1
		LB=1
	fi

	local MSG A B
	if [[ -n "$3" && -n "$4" ]]; then
		MSG="Files $1 and $2 must be identical between \`$3\` and \`$4\`."
		A=$(sed -n -e "/$3/,/$4/p" "$1")
		B=$(sed -n -e "/$3/,/$4/p" "$2")
	elif [[ -n "$3" ]]; then
		MSG="Files $1 and $2 must be identical from \`$3\` on."
		A=$(sed -n -e "/$3/,\$p" "$1")
		B=$(sed -n -e "/$3/,\$p" "$2")
	elif [[ -n "$4" ]]; then
		MSG="Files $1 and $2 must be identical up to \`$4\`."
		A=$(sed -n -e "1,/$4/p" "$1")
		B=$(sed -n -e "1,/$4/p" "$2")
	else
		MSG="Files $1 and $2 must be identical."
		A=$(< "$1" )
		B=$(< "$2" )
	fi

	if [[ "$A" != "$B" ]]; then
		printf '\n'
		if [[ -n "$CI" ]]; then
			printf "::error file=%s,line=%d::%s\\n" "$1" "${LA%%:*}" "$MSG"
			printf "::error file=%s,line=%d::%s\\n" "$2" "${LB%%:*}" "$MSG"
		else
			error "$MSG"
		fi

		diff -u /dev/fd/3 --label "$1" /dev/fd/4 --label "$2" 3<<<"$A" 4<<<"$B" || true
		EXIT=1
	fi
}

compare readme.md projects/plugins/jetpack/readme.md '^## Security' '^<!-- end sync section -->$'
compare projects/packages/identity-crisis/src/scss/functions/colors.scss projects/plugins/jetpack/_inc/client/scss/functions/colors.scss
compare projects/packages/identity-crisis/src/scss/variables/_colors.scss projects/plugins/jetpack/_inc/client/scss/variables/_colors.scss

exit $EXIT
