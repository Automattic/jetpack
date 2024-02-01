#!/usr/bin/env bash

set -eo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
BASE="$PWD"
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-v] [-f]

		Validate that all changelogger change files are valid and all project
		versions are up to date with respect to changelogger.

		Options:
		 -v: Output debug information. Repeat to output additional information.
	EOH
	exit 1
}

ARGS=( "--basedir=$BASE" )
ARGS2=()
if [[ -n "$CI" ]]; then
	ARGS+=( '--gh-action' )
fi

# Sets options.
VERBOSE=false
CHECK_OR_UPDATE=-c
while getopts ":vfh" opt; do
	case ${opt} in
		v)
			if $VERBOSE; then
				ARGS+=( '-v' )
				ARGS2+=( '-v' )
			else
				VERBOSE=true
			fi
			;;
		f)
			CHECK_OR_UPDATE=-u
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

if ! $VERBOSE; then
	. "$BASE/tools/includes/spin.sh"
	function debug {
		:
	}
else
	. "$BASE/tools/includes/nospin.sh"
	if [[ -n "$CI" ]]; then
		function debug {
			# Grey doesn't work well in GH's output.
			blue "$@"
		}
	fi
fi

init_changelogger

function err {
	if [[ -n "$CI" ]]; then
		echo "::error::$*"
	else
		error "$*"
	fi
}

EXIT=0
for FILE in projects/*/*/composer.json; do
	spin
	DIR="${FILE%/composer.json}"
	SLUG="${DIR#projects/}"
	cd "$BASE/$DIR"

	debug "Validating change entries for $SLUG"
	if ! changelogger validate "${ARGS[@]}"; then
		EXIT=1
		continue
	fi

	debug "Checking version numbers $SLUG"
	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	PRERELEASE=$(alpha_tag composer.json 0)
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		VER=$(changelogger version next --default-first-version --prerelease=$PRERELEASE) || { err "$VER"; EXIT=1; continue; }
	else
		VER=$(changelogger version current --default-first-version --prerelease=$PRERELEASE) || { err "$VER"; EXIT=1; continue; }
	fi
	if ! $BASE/tools/project-version.sh "${ARGS2[@]}" $CHECK_OR_UPDATE "$VER" "$SLUG"; then
		EXIT=1
		continue
	fi
done
spinclear
exit $EXIT
