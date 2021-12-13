#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# This script obtains the contributor list by comparing the specified version with the previous major version.

function usage {
	cat <<-EOH
		usage: $0 <project> [version]

		Obtains the list of contributors for a major release.

	EOH
	exit 1
}

if [[ -z $1 ]]; then
    usage
fi


if [[ -z $2 ]]; then
	info "What version do you want to get contributors for?"
	read -r CURRENT_VERSION
else 
	CURRENT_VERSION="$2"
fi

function join {
	local IFS='.'
	shift
	echo "$*"
}

# Some branches use x.y.x, like boost/branch-1.2.0
PREVIOUS_VERSION=
while IFS= read -r VER; do
	if [[ "$VER" == "$CURRENT_VERSION" ]]; then
		read -r PREVIOUS_VERSION 
		break 
	fi 
done < <( sed -n -E -e 's/^## \[?([0-9.]+)\]? - .*$/\1/p' "projects/plugins/$1/CHANGELOG.md" )
[[ -n "$PREVIOUS_VERSION" ]] || die "Version $CURRENT_VERSION was not found or was the first version."

# Display the list.
info "Contributors for $1 $CURRENT_VERSION are:"
git log --format='%an' --no-merges origin/$1/branch-$PREVIOUS_VERSION..origin/$1/branch-$CURRENT_VERSION | sort | uniq | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/, /g' | sed 's/renovate\[bot\], //' | tee >(pbcopy)
info "Above contributors have been copied to your clipboard!"
