#!/bin/bash

INTERACTIVE=true
if [[ ! -t 0 ]]; then
	INTERACTIVE=false
fi

# Ask whether to proceed.
#
# Args:
#  1: The situation that requires prompting.
#  2: Optional text to replace "Proceed?" as the question.
#
# Returns success if "yes", failure if "no" or non-interactive.
function proceed_p {
	if ! $INTERACTIVE; then
		echo "$1 Aborting" >&2
		return 42
	fi
	local OK

	# Clear input before prompting
	while read -r -t 0 OK; do read -r OK; done

	[[ "$1" ]] && M="$1 " || M=""
	read -n 1 -p "$M${2:-Proceed?} [y/N] " OK
	echo ""
	[[ "$OK" == "y" || "$OK" == "Y" ]]
}
