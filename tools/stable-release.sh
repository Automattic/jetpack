#!/usr/bin/env bash

set -eo pipefail

# Prompt for PRs or commits to apply, committing each.
function apply_patches {
	local pr_or_commit commits

	while true; do
		read -rep "PR or commit to cherry-pick, or 'done' if finished: " pr_or_commit
		[[ $pr_or_commit == "done" ]] && break
		[[ -n $pr_or_commit ]] || continue

		# Abort if a failure left changes behind (e.g. an aborted commit).
		if ! "$BASE/tools/apply-patch.sh" "$pr_or_commit" && [[ -n $(git status --porcelain) ]]; then
			exit 1
		fi
	done

	commits=$(git log --reverse --format='  %h %s' "$START_COMMIT..HEAD")
	echo 'Commits added:'
	echo "${commits:-  (none)}"
}

# Output the changed projects
function detect_changed_projects {
	mapfile -t PROJECTS < <(
		git -c core.quotepath=off diff --no-renames --name-only "$START_COMMIT..HEAD" -- projects/ \
			| sed -n 's|^projects/\([^/]*/[^/]*\)/.*|\1|p' | sort -u
	)

	if [[ ${#PROJECTS[@]} -eq 0 ]]; then
		die 'No projects changed.'
	fi
	echo 'Changed projects:'
	printf '  %s\n' "${PROJECTS[@]}"
}

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/version-compare.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [<plugin> [<version>]]

		Release a plugin from its release branch, prompting for anything not given.
		  <plugin>   Plugin to release, e.g. jetpack.
		  <version>  Version to release, e.g. 16.4.1.
	EOH
	exit
}

if [[ $# -gt 2 || $1 == -h || $1 == --help ]]; then
	usage
fi

# if [[ -n $(git status --porcelain) ]]; then
# 	die 'Working tree not clean; commit or stash changes first.'
# fi

# @todo: We might want to either check we're on a release branch or even switch to a release branch at this point.

PLUGIN=$1
if [[ -z "$PLUGIN" ]]; then
	read -rep 'Plugin to release (e.g. jetpack): ' PLUGIN
fi
# Accept with or without prefix.
PLUGIN=plugins/${PLUGIN#plugins/}
if [[ ! -f $BASE/projects/$PLUGIN/composer.json ]]; then
	die "No such plugin: $PLUGIN"
elif ! jq -e '.extra["release-branch-prefix"]' "$BASE/projects/$PLUGIN/composer.json" &>/dev/null; then
	die "$PLUGIN has no release branch prefix."
fi

# For now, just take manual versions, but a future iteration could grab the latest tag and suggest the next point release.
# We'd still need a way to manually specify a version, though, as we might just want a second beta.
VERSION=$2
VERSION_REGEX='^[0-9]+(\.[0-9]+)+(-.*)?$'
if [[ -z $VERSION ]]; then
	read -rep 'Version to release (e.g. 16.4.1): ' VERSION || exit 1
fi
if [[ ! "$VERSION" =~ $VERSION_REGEX ]]; then
	die "Invalid version: $VERSION"
fi

CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN")
# shellcheck disable=SC2310
if version_compare "$CUR_VERSION" "$VERSION"; then
	die "Version $VERSION is not higher than $CUR_VERSION."
fi
info "$PLUGIN: $CUR_VERSION -> $VERSION"

START_COMMIT=$(git rev-parse HEAD)

apply_patches
detect_changed_projects
