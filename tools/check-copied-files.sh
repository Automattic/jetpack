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

# Compare objects in two JSON files
# $1 - First file.
# $2 - Second file.
# $3 - jq style path expression.
compareJSON () {
	if ! command -v jq &> /dev/null; then
		if [[ -z "$CI" ]]; then
			$JQWARNED || warn "Command jq is not found, skipping checks for copied JSON paths."
		else
			$JQWARNED || error "Command jq is not found, cannot check for copied JSON paths."
			EXIT=1
		fi
		JQWARNED=true
		return
	fi

	local JSPATH=$(jq -n "path( $3 )" 2>/dev/null)
	if [[ -z "$JSPATH" ]]; then
		[[ -n "$CI" ]] && printf '::error::'
		error "Invalid path expression \`$3\`."
		EXIT=1
		return
	fi

	local FAIL=
	local A=$(jq --argjson path "$JSPATH" 'getpath( $path )' "$1" 2>/dev/null)
	local LA=$(jq --stream --arg obj "$A" --argjson path "$JSPATH" 'if length == 1 then .[0][:-1] else .[0] end | if . == $path then input_line_number - ( $obj | gsub( "[^\n]"; "" ) | length ) else empty end' "$1")
	if [[ -z "$LA" ]]; then
		[[ -n "$CI" ]] && printf '::error file=%s::' "$1"
		error "Did not find path \`$3\` in $1."
		FAIL=1
	fi
	local B=$(jq --argjson path "$JSPATH" 'getpath( $path )' "$2" 2>/dev/null)
	local LB=$(jq --stream --arg obj "$B" --argjson path "$JSPATH" 'if length == 1 then .[0][:-1] else .[0] end | if . == $path then input_line_number - ( $obj | gsub( "[^\n]"; "" ) | length ) else empty end' "$2")
	if [[ -z "$LB" ]]; then
		[[ -n "$CI" ]] && printf '::error file=%s::' "$2"
		error "Did not find path \`$3\` in $2."
		FAIL=1
	fi
	if [[ -n "$FAIL" ]]; then
		EXIT=1
		return
	fi

	if [[ "$A" != "$B" ]]; then
		printf '\n'
		local MSG="JSON values at \`$3\` in $1 and $2 must be identical."
		if [[ -n "$CI" ]]; then
			printf "::error file=%s,line=%d::%s\\n" "$1" "${LA}" "$MSG"
			printf "::error file=%s,line=%d::%s\\n" "$2" "${LB}" "$MSG"
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

for f in $(git -c core.quotepath=off ls-files '**/package.json'); do
	compareJSON package.json "$f" '.engines'
done

exit $EXIT
