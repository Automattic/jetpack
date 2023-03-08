#!/bin/bash

CLBASE=$(cd "$(dirname "$BASH_SOURCE[0]")/../.." && pwd)

source "$CLBASE/tools/includes/chalk-lite.sh"

# Set up changelogger if necessary.
function init_changelogger {
	local CL="$CLBASE/projects/packages/changelogger/bin/changelogger"
	if ! "$CL" &>/dev/null; then
		debug "Preparing changelogger"
		(cd "$CLBASE/projects/packages/changelogger" && composer update --quiet)
		if ! "$CL" &>/dev/null; then
			die "Changelogger is not runnable via $CL"
		fi
	fi

	# Redefine function to do nothing now that it has run once.
	function init_changelogger {
		:
	}
}

# Run changelogger, setting it up if necessary.
#
# - $@: args to changelogger
function changelogger {
	init_changelogger > /dev/null
	"$CLBASE/projects/packages/changelogger/bin/changelogger" "$@"
}
