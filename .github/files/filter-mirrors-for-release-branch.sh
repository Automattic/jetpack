#!/bin/bash

## Environment used by this script:
#
# Required:
# - BUILD_BASE: Path to the build directory, which contains "mirrors.txt" and directories for each repo to mirror to.
# - GITHUB_REF: Git ref being mirrored from, e.g. "refs/heads/trunk". Must begin with "refs/heads/".

# Halt on error
set -eo pipefail

if [[ -z "$BUILD_BASE" ]]; then
	echo "::error::BUILD_BASE must be set"
elif [[ ! -d "$BUILD_BASE" ]]; then
	echo "::error::$BUILD_BASE does not exist or is not a directory"
fi

if [[ "$GITHUB_REF" =~ ^refs/heads/ ]]; then
	BRANCH=${GITHUB_REF#refs/heads/}
else
	echo "Could not determine branch name from $GITHUB_REF"
	exit 1
fi

if [[ ! "$BRANCH" =~ /branch- ]]; then
	echo "::error::Not a release branch, no filtering needed."
	exit 0
fi

if [[ ! -f "$BUILD_BASE/mirrors.txt" ]]; then
	echo "::error::File $BUILD_BASE/mirrors.txt does not exist or is not a file"
elif [[ ! -s "$BUILD_BASE/mirrors.txt" ]]; then
	echo "No mirrors were successfully built. Skipping."
	exit 0
fi

mv "$BUILD_BASE/mirrors.txt" "$BUILD_BASE/mirrors.txt.orig"
while read -r GIT_SLUG; do
	CLONE_DIR="${BUILD_BASE}/${GIT_SLUG}"
	cd "${CLONE_DIR}"

	PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' composer.json)
	if [[ -z "$PREFIX" ]]; then
		echo "Not mirroring release branch $BRANCH to $GIT_SLUG: no .extra.release-branch-prefix is declared in composer.json"
	elif [[ "${BRANCH%%/branch-*}" != "$PREFIX" ]]; then
		echo "Not mirroring release branch $BRANCH to $GIT_SLUG: branch prefix \`${BRANCH%%/branch-*}\` != declared prefix \`$PREFIX\`"
	else
		echo "Mirroring release branch $BRANCH to $GIT_SLUG: branch prefix \`${BRANCH%%/branch-*}\` == declared prefix \`$PREFIX\`"
		echo "$GIT_SLUG" >&4
	fi
done < "$BUILD_BASE/mirrors.txt.orig" 4> "$BUILD_BASE/mirrors.txt"
