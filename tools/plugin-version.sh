#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/plugin-functions.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 <plugin>

		  Print the version from the plguin's header. The <plugin> may be either
		  the name of a directory in projects/plugins/, or a path to a plugin
		  directorty or file.

		usage: $0 -n [count] -v version

		  Normalizes the passed version number. Set a count to specify the minimum
		  number of components in the normalized version number.

		usage: $0 -v version <plugin>

		  Update the version of the specified plugin. See tools/project-version.sh
		  for details.
	EOH
	exit 1
}

if [[ $# -eq 0 ]]; then
	usage
fi

# Sets options.
OP=get
while getopts ":v:n:h" opt; do
	case ${opt} in
		v)
			VERSION_RAW=$OPTARG
			OP=set
			;;
		n)
			NORMALIZE_COUNT=$OPTARG
			;;
		h)
			usage
			;;
		:)
			if [[ $OPTARG == "n" ]]; then
				NORMALIZE_COUNT=2
			else
				die "Argument -$OPTARG requires a value."
			fi
			;;
		?)
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

# If we have a version request set, do that and exit.
if [[ -n "$NORMALIZE_COUNT" ]]; then
	if [[ -z "$VERSION_RAW" ]]; then
		die "Option -n requires -v."
	fi
	normalize_version_number "$VERSION_RAW" "$NORMALIZE_COUNT"
	echo "$NORMALIZED_VERSION"
	exit
fi

# Determine the plugin
if [[ -z "$1" ]]; then
	die "A plugin must be specified unless -n is used."
else
	process_plugin_arg "$1"
fi

# If we're supposed to read the version, do that.
if [[ "$OP" == "get" ]]; then
	sed -n -E -e 's/^ \* Version:[[:blank:]]+([^[:blank:]](.*[^[:blank:]])?)[[:blank:]]*$/\1/p' "$PLUGIN_FILE"
	exit
fi

# Use tools/project-version.sh to do the actual setting
exec $BASE/tools/project-version.sh -u "$VERSION_RAW" "${PLUGIN_DIR#$BASE/projects/}"
