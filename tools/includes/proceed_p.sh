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
#
# Returns success if "yes", failure if "no" or non-interactive.
function proceed_p {
	if ! $INTERACTIVE; then
		error "$1 Aborting"
		return 42
	fi
	local OK

	# Clear input before prompting
	while read -r -t 0 OK; do read -r OK; done

	local PROMPT
	[[ -n "$1" ]] && PROMPT="$1 "
	PROMPT="${PROMPT}${2:-Proceed?} [y/N] "
	if color_supported; then
		PROMPT=$(FORCE_COLOR=1 prompt "$PROMPT")
	fi

	read -n 1 -p "$PROMPT" OK
	echo ""
	[[ "$OK" == "y" || "$OK" == "Y" ]]
}
