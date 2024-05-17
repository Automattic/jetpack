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

# Get the git hashes for the current and previous versions.
CURRENT_HASH=
PREVIOUS_HASH=
PREVIOUS_VERSION=
while IFS=' ' read -r HASH VER; do
	if [[ -z "$CURRENT_HASH" && "$VER" == "$CURRENT_VERSION" ]]; then
		# Keep the latest hash that matches CURRENT_VERSION.
		CURRENT_HASH=$HASH
	elif [[ "$VER" == *-* || "$VER" == *+* ]]; then
		# Skip any prerelease or postrelease versions when looking for the previous version.
		continue
	elif [[ -n "$CURRENT_HASH" && -z "$PREVIOUS_VERSION" && "$VER" != "$CURRENT_VERSION" ]]; then
		# Keep the first version after that as PREVIOUS_VERSION.
		PREVIOUS_HASH=$HASH
		PREVIOUS_VERSION=$VER
	elif [[ -n "$CURRENT_HASH" && -n "$PREVIOUS_VERSION" && "$VER" == "$PREVIOUS_VERSION" ]]; then
		# But if for some reason there are multiple hashes for the same PREVIOUS_VERSION, use the earliest one.
		PREVIOUS_HASH=$HASH
	elif [[ -n "$CURRENT_HASH" && -n "$PREVIOUS_HASH" ]]; then
		# Once we find the next version after PREVIOUS_VERSION, we can stop looking.
		break
	fi
done < <( for h in $(git log --format='%H' "projects/$1/CHANGELOG.md"); do printf "%s %s\n" "$h" "$(git show "$h:projects/$1/CHANGELOG.md" | sed -n -E -e 's/^## \[?([0-9.]+(-[a-zA-Z0-9.+-]*)?)\]? - .*$/\1/p' -e 'tq' -e 'd' -e ':q' -e 'q')"; done )
[[ -n "$CURRENT_HASH" ]] || die "Version $CURRENT_VERSION was not found."
[[ -n "$PREVIOUS_HASH" ]] || die "No versions found before $CURRENT_VERSION."

echo "Getting contributors from $PREVIOUS_VERSION to $CURRENT_VERSION..."

# Display the list.
TMP="$( git log --format='%an' --no-merges "$PREVIOUS_HASH..$CURRENT_HASH" | sort -u | grep -E -v 'renovate\[bot\]|Calypso Bot' )"
mapfile -t NAMESARR <<<"$TMP"
printf -v NAMES '%s, ' "${NAMESARR[@]}"
NAMES="${NAMES%, }"
info "Contributors for $1 $CURRENT_VERSION are:"
echo "$NAMES"
if command -v pbcopy &>/dev/null; then
	pbcopy <<<"$NAMES"
	info "Above contributors have been copied to your clipboard!"
fi
