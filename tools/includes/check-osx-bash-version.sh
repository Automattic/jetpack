#!/usr/bin/env bash

# Note, if you're including this then your shebang probably also needs to be
# like the one above, because poor OS X users will have the new bash at
# /usr/local/bin/bash instead of /bin/bash like the rest of the world expects.

if [[ -z "${BASH_VERSINFO}" || -z "${BASH_VERSINFO[0]}" || ${BASH_VERSINFO[0]} -lt 4 ]]; then
	. "$(dirname "$BASH_SOURCE[0]")/chalk-lite.sh"

	[[ "$BASH_VERSION" ]] && V=" You have $BASH_VERSION." || V=
	error <<-EOM
		This script requires Bash version >= 4.$V

		If you're on Mac OS, you can install an updated version of bash with
		  brew install bash
	EOM
	exit 1
fi
