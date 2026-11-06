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

# Determine which packages need release: those changed or with change files, and those depending on such a JS package.
function detect_packages_to_release {
	local slug changes_dir plugin_deps patched=() with_change_files=() changed_js_packages=()
	local -A changed_projects=()

	# Patches may (though shouldn't) lack a change file, so first check those.
	mapfile -t patched < <(git -c core.quotepath=off diff --no-renames --name-only "$START_COMMIT..HEAD" -- projects/ | sed -n 's|^projects/\([^/]*/[^/]*\)/.*|\1|p' | sort -u)
	for slug in "${patched[@]}"; do
		changed_projects[$slug]=1
	done
	echo 'Projects changed by patches:'
	printf '  %s\n' "${patched[@]:-(none)}"

	# Then check for the plugin's dependencies for projects with change files.
	plugin_deps=$(pnpm jetpack dependencies list --add-dependencies "$PLUGIN")
	for slug in $plugin_deps; do
		changes_dir="$BASE/projects/$slug/$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' "$BASE/projects/$slug/composer.json")"
		if [[ -d $changes_dir && -n $(ls -- "$changes_dir") ]]; then
			with_change_files+=( "$slug" )
			changed_projects[$slug]=1
		fi
		# Track any changed JS packages as well.
		if [[ $slug == js-packages/* && -v changed_projects[$slug] ]]; then
			changed_js_packages+=( "$slug" )
		fi
	done
	echo "$PLUGIN dependencies with change files:"
	printf '  %s\n' "${with_change_files[@]:-(none)}"

	# JS packages are never released from a release branch, but the PHP packages depending on them are.
	if [[ ${#changed_js_packages[@]} -gt 0 ]]; then
		for slug in $(pnpm jetpack dependencies list --add-dependents "${changed_js_packages[@]}"); do
			changed_projects[$slug]=1
		done
	fi

	# Finally, filter out the noise to only include the packages that this plugin relies on.
	PACKAGES_TO_RELEASE=()
	for slug in $plugin_deps; do
		if [[ $slug == packages/* && -v changed_projects[$slug] ]]; then
			PACKAGES_TO_RELEASE+=( "$slug" )
		fi
	done
	echo 'Packages to release:'
	printf '  %s\n' "${PACKAGES_TO_RELEASE[@]:-(none)}"
}

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
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
	read -rep 'Version to release (e.g. 16.4.1): ' VERSION
fi
if [[ ! "$VERSION" =~ $VERSION_REGEX ]]; then
	die "Invalid version: $VERSION"
fi

# Eventually we could try guessing the source branch based on the version provided above.
ORIGINAL_BRANCH=$(git branch --show-current)
read -rep 'Release version to start from (e.g. 16.4): ' FROM_VERSION
if [[ ! "$FROM_VERSION" =~ $VERSION_REGEX ]]; then
	die "Invalid version: $FROM_VERSION"
fi
# Note that some plugins have more than one prefix. Go with the first.
# @todo: Check if we need those other prefixes anymore.
PREFIX=$(jq -r '.extra["release-branch-prefix"] | if type == "array" then first else . end' "$BASE/projects/$PLUGIN/composer.json")
RELEASE_BRANCH="$PREFIX/branch-$FROM_VERSION"
if ! git rev-parse -q --verify "refs/heads/$RELEASE_BRANCH" >/dev/null && ! git rev-parse -q --verify "refs/remotes/origin/$RELEASE_BRANCH" >/dev/null; then
	die "No such branch: $RELEASE_BRANCH"
fi
git switch -q "$RELEASE_BRANCH"

CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN")
# shellcheck disable=SC2310
if version_compare "$CUR_VERSION" "$VERSION"; then
	die "Version $VERSION is not higher than $CUR_VERSION."
fi
info "$PLUGIN: $CUR_VERSION -> $VERSION"

START_COMMIT=$(git rev-parse HEAD)

apply_patches
detect_packages_to_release

git switch -q "$ORIGINAL_BRANCH"
