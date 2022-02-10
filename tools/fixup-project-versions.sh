#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v]

		Make sure that all package versions and intra-monorepo dependencies are
		up to date.

		Options:
		 -v: Output debug information. Repeat to output additional information.
	EOH
	exit 1
}

# Sets options.
VERBOSE=
while getopts ":vh" opt; do
	case ${opt} in
		v)
			VERBOSE="${VERBOSE:--}v"
			;;
		h)
			usage
			;;
		:)
			die "Argument -$OPTARG requires a value."
			;;
		?)
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

info 'Checking project versions'
tools/changelogger-validate-all.sh -f $VERBOSE

info 'Checking intra-monorepo dependencies'
tools/check-intra-monorepo-deps.sh -ua $VERBOSE
