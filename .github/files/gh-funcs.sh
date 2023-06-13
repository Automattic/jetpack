#!/bin/bash

## Set an output value in GitHub Actions.
#
# - $1: Output name.
# - $2: Output value. Do not encode newlines.
function gh_set_output {
	local DELIM="delim-$RANDOM-$RANDOM-$RANDOM-$RANDOM"
	printf "%s<<%s\n%s\n%s\n" "$1" "$DELIM" "$2" "$DELIM" >> "$GITHUB_OUTPUT"
}
