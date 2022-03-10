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

# Get the branch prefix.
PREFIX=$(jq -r '.extra["release-branch-prefix"]' projects/$1/composer.json)

# Get the previous version that we want to compare against.
PREVIOUS_VERSION=
while IFS= read -r VER; do
    if [[ "$VER" == "$CURRENT_VERSION" ]]; then
		while IFS= read -r VER; do
			# Find the previous version we have a release branch for. 
			if git rev-parse --verify "origin/$PREFIX/branch-$VER" &>/dev/null; then
				PREVIOUS_VERSION="$VER"
				break 2
			fi
		done
		die "Could not find an existing branch for a version prior to $CURRENT_VERSION"
    fi
done < <( sed -n -E -e 's/^## \[?([0-9.]+)(-beta)?\]? - .*$/\1/p' "projects/$1/CHANGELOG.md" )
[[ -n "$PREVIOUS_VERSION" ]] || die "Version $CURRENT_VERSION was not found or was the first version."

echo "Getting contributors from $PREVIOUS_VERSION to $CURRENT_VERSION..."

# Display the list.
TMP="$( git log --format='%an' --no-merges "origin/$PREFIX/branch-$PREVIOUS_VERSION..origin/$PREFIX/branch-$CURRENT_VERSION" | sort -u | grep -E -v 'renovate\[bot\]|matticbot' )"
mapfile -t NAMESARR <<<"$TMP"
printf -v NAMES '%s, ' "${NAMESARR[@]}"
NAMES="${NAMES%, }"
info "Contributors for $1 $CURRENT_VERSION are:"
echo "$NAMES"
if command -v pbcopy &>/dev/null; then
    pbcopy <<<"$NAMES"
    info "Above contributors have been copied to your clipboard!"
fi
