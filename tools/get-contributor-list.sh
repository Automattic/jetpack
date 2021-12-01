#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# This script obtains the contributor list by comparing the specified version with the previous major version.

function usage {
	cat <<-EOH
		usage: $0 [project] <version>

		Obtains the list of contributors for a major release.

	EOH
	exit 1
}

if [[ -z $1 ]]; then
    usage
    exit 1
fi


if [[ -z $2 ]]; then
	info "What version do you want to get contributors for?"
	read CURRENT_VERSION
else 
	CURRENT_VERSION="$2"
fi

function join {
	local IFS='.'
	shift
	echo "$*"
}

# Some branches use x.y.x, like boost/branch-1.2.0
IFS='.' read -r -a VERSION <<< "$CURRENT_VERSION"
if [[ ${VERSION[2]} ]]; then
	unset "VERSION[2]"
	MAJOR_VERSION=$( join . ${VERSION[@]} )
	MAJOR_VERSION=$(echo "$MAJOR_VERSION - .1" | bc )
	PREVIOUS_VERSION=$MAJOR_VERSION.0
else 
	PREVIOUS_VERSION=$(echo "$CURRENT_VERSION - .1" | bc )
fi

# Fetch the branches we need to obtain contributor list from
info 'Fetching relevant branches...'.
git fetch origin $1/branch-$PREVIOUS_VERSION:$1/branch-$PREVIOUS_VERSION
git fetch origin $1/branch-$CURRENT_VERSION:$1/branch-$CURRENT_VERSION

# Display the list.
info "Contributors for $1 $CURRENT_VERSION are:"
git log --format='%an' --no-merges $1/branch-$PREVIOUS_VERSION..$1/branch-$CURRENT_VERSION | sort | uniq | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/, /g' | sed 's/renovate\[bot\], //' | tee >(pbcopy)
info "Above contributors have been copied to your clipboard!"

exit