#!/bin/bash

INTERACTIVE=true
if [[ ! -t 0 ]]; then
	INTERACTIVE=false
fi

. "$(dirname "$BASH_SOURCE[0]")/chalk-lite.sh"

# Ask whether to proceed.
#
# Args:
#  1: The situation that requires prompting.
#  2: Optional text to replace "Proceed?" as the question.
#  3: Default response, 'Y', 'N', or ''. Default 'N'.
#
# Returns success if "yes", failure if "no" or non-interactive.
# Note non-interactive and EOF always abort even if the default is "Y".
function proceed_p {
	if ! $INTERACTIVE; then
		error "$1 Aborting"
		return 42
	fi
	local OK YN DEF

	if [[ "${3-N}" == 'n' || "${3-N}" == 'N' ]]; then
		YN="y/N"
		DEF=N
	elif [[ "${3-N}" == 'y' || "${3-N}" == 'Y' ]]; then
		YN="Y/n"
		DEF=Y
	else
		YN="y/n"
		DEF=
	fi

	# Clear input before prompting
	while read -r -t 0 OK; do read -r OK; done

	local PROMPT
	[[ -n "$1" ]] && PROMPT="$1 "
	PROMPT="${PROMPT}${2:-Proceed?} [$YN] "
	if color_supported; then
		PROMPT=$(FORCE_COLOR=1 prompt "$PROMPT")
	fi

	while read -r -s -n 1 -p "$PROMPT" OK; do
		echo "${OK:-$DEF}"
		if [[ "${OK:-$DEF}" == "y" || "${OK:-$DEF}" == "Y" ]]; then
			return 0
		elif [[ "${OK:-$DEF}" == "n" || "${OK:-$DEF}" == "N" ]]; then
			return 1
		fi
	done

	error "Aborting due to EOF"
	return 42
}
