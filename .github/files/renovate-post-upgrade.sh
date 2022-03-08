#!/bin/bash

set -eo pipefail

BASE=$PWD
. "$BASE/tools/includes/alpha-tag.sh"

function die {
	echo "::error::$*"
	exit 1
}

# Add a change file for every project touched in the PR, if any.
pnpm --quiet install
cd projects/packages/changelogger
composer --quiet update
cd "$BASE"
CL="$BASE/projects/packages/changelogger/bin/changelogger"

ANY=false
for DIR in $(git -c core.quotepath=off diff --name-only "$BASE_REF"..."$HEAD_REF" | sed -nE 's!^(projects/[^/]+/[^/]+)/.*!\1!p' | sort -u); do
	ANY=true
	SLUG="${DIR#projects/}"
	echo "Adding change file for $SLUG"
	cd "$DIR"

	ARGS=()
	ARGS=( add --no-interaction --filename-auto-suffix --significance=patch )

	CLTYPE="$(jq -r '.extra["changelogger-default-type"] // "changed"' composer.json)"
	if [[ -n "$CLTYPE" ]]; then
		ARGS+=( "--type=$CLTYPE" )
	fi

	ARGS+=( --entry="Updated package dependencies" )

	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' composer.json)"
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		"$CL" "${ARGS[@]}"
	else
		"$CL" "${ARGS[@]}"
		echo "Updating version for $SLUG"
		PRERELEASE=$(alpha_tag "$CL" composer.json 0)
		VER=$("$CL" version next --default-first-version --prerelease=$PRERELEASE) || { echo "$VER"; exit 1; }
		"$BASE/tools/project-version.sh" -u "$VER" "$SLUG"
	fi
	cd "$BASE"
done

if ! $ANY; then
	echo "No projects are touched in this renovate PR, so nothing to do."
	exit 0
fi

# Update deps and lock files.
echo "Updating dependencies on changed projects"
tools/check-intra-monorepo-deps.sh -ua
