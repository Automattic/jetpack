#!/bin/bash

# Test if color is supported.
function color_supported {
	[[ -n "$NO_COLOR" ]] && return 1
	[[ -n "$FORCE_COLOR" ]] && return 0
	[[ -t 1 ]]
}

# Print possibly-colored text to standard output.
#
# The first parameter is the ANSI SGR parameter string, i.e. the part that
# goes in between the `\e[` and the `m`.
#
# If passed additional parameters, those are printed. Otherwise, lines are read
# from standard input and printed. Examples:
#
#   chalk 31 'This prints red text'
#
#   chalk 31 <<EOM
#   This also prints red text.
#   EOM
#
#   chalk 31 'This prints red text to STDERR' >&2
function chalk {
	local CC="$1" LINE FMT
	shift
	if color_supported; then
		FMT="\e[${CC}m%s\e[0m\n"
	else
		FMT="%s\n"
	fi
	if [[ $# -gt 0 ]]; then
		printf "$FMT" "$*"
	else
		while IFS= read -r LINE; do
			printf "$FMT" "$LINE"
		done
	fi
}

# All the rest of these functions are just wrappers around `chalk` that
# supply a particular first argument. `error` and `warn` also output to STDERR
# by default.
#
#   info "Here's some information"
#
#   error <<-EOM
#   Something went wrong!
#   EOM


function debug {
	chalk '1;30' "$@"
}

function success {
	if [[ $(tput colors 2>/dev/null) -gt 8 ]]; then
		chalk '1;38;5;41' "$@"
	else
		chalk '1;32' "$@"
	fi
}

function info {
	chalk '1;37' "$@"
}

function warn {
	chalk '1;33' "$@" >&2
}

function error {
	chalk '1;31' "$@" >&2
}

function die {
	error "$@"
	exit 1
}

function prompt {
	yellow "$@"
}

function red {
	chalk '31' "$@"
}

function green {
	chalk '32' "$@"
}

function jetpackGreen {
	if [[ $(tput colors 2>/dev/null) -gt 8 ]]; then
		chalk '38;5;41' "$@"
	else
		chalk '32' "$@"
	fi
}

function yellow {
	chalk '33' "$@"
}

function blue {
	chalk '34' "$@"
}

function purple {
	chalk '35' "$@"
}

function cyan {
	chalk '36' "$@"
}
