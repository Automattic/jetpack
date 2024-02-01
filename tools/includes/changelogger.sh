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

# Fetch the default changelogger type.
#
# Executes `changelogger add --no-interaction --significance=patch --type=... --entry="$1" --comment="$2"`.
#
# - $1: Changelog entry text.
# - $2: Changelog comment text.
# - $@: Any additional changelogger arguments to pass.
function changelogger_add {
	init_changelogger

	local ARGS=( add --no-interaction --significance=patch --filename-auto-suffix --entry="$1" --comment="$2" )
	shift 2

	local CLTYPE="$(jq -r '.extra["changelogger-default-type"] // "changed"' composer.json)"
	if [[ -n "$CLTYPE" ]]; then
		ARGS+=( "--type=$CLTYPE" )
	fi

	if [[ $# -gt 0 ]]; then
		ARGS+=( "$@" )
	fi

	changelogger "${ARGS[@]}"
}
