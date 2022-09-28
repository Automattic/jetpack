#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> <version>

		Create a new release branch for the specified plugin. The <plugin> may be
		either the name of a directory in projects/plugins/, or a path to a plugin
		directory or file.

		Options:
		  --non-interactive  Exit instead of prompting for questionable cases.
	EOH
	exit 1
}

# Process args.
ARGS=()
INTERACTIVE=true
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--non-interactive)
			INTERACTIVE=false
			;;
		--help)
			usage
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done

if $INTERACTIVE && [[ ! -t 0 ]]; then
	debug "Input is not a terminal, forcing --non-interactive."
	INTERACTIVE=false
fi
if [[ ${#ARGS[@]} -ne 2 ]]; then
	usage
fi
process_plugin_arg "${ARGS[0]}"
normalize_version_number "${ARGS[1]}"

info "Checking if the plugin is releasable..."
PLUGIN_NAME=$(jq --arg n "${ARGS[0]}" -r '.name // $n' "$PLUGIN_DIR/composer.json")
PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' "$PLUGIN_DIR/composer.json")
MIRROR=$(jq -r '.extra["mirror-repo"] // ""' "$PLUGIN_DIR/composer.json")
if [[ -z "$PREFIX" ]]; then
	die "Plugin $PLUGIN_NAME does not have a release branch prefix defined in composer.json. Aborting."
fi

# Check the version.
if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
	die "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
fi
CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN_DIR")
if pnpm semver --range "<= $("$BASE/tools/plugin-version.sh" -n 3 -v "$CUR_VERSION")" "$("$BASE/tools/plugin-version.sh" -n 3 -v "$NORMALIZED_VERSION")" &>/dev/null; then
	proceed_p "Version $NORMALIZED_VERSION <= $CUR_VERSION."
fi

info "Checking working directory status..."
if [[ "$(git status --porcelain)" ]]; then
	die "Working directory is not clean. Aborting."
fi

# Make sure we're on latest trunk, or at least that the user is fine with it.
git fetch
if [[ "$(git rev-parse --abbrev-ref HEAD)" != "trunk" ]]; then
	if proceed_p "Current branch is $(git rev-parse --abbrev-ref HEAD)." "Check out trunk?"; then
		git checkout trunk
	else
		proceed_p " " "Continue anyway?"
	fi
fi
COMMITS="$(git log HEAD.. --oneline)"
if [[ -n "$COMMITS" ]]; then
	info "The current branch is behind $(git rev-parse --abbrev-ref --symbolic-full-name @{u})."
	echo "$COMMITS"
	if proceed_p "" "Pull?"; then
		git pull
	else
		proceed_p " " "Continue anyway?"
	fi
fi

# See if the release branch already exists.
BRANCH="$PREFIX/branch-${NORMALIZED_VERSION%%-*}"
if [[ "$(git ls-remote --heads origin "$BRANCH")" ]]; then
	die "Release branch $BRANCH has already been pushed. Aborting."
elif [[ "$(git branch --list "$BRANCH")" ]]; then
	proceed_p "Release branch $BRANCH already exists locally, but has not been pushed." "Delete it?"
	git branch -D "$BRANCH"
fi

BASE_REF="$(git rev-parse --abbrev-ref HEAD)"
info "Creating release branch $BRANCH based on $BASE_REF..."
git checkout -b "$BRANCH"

info "Updating version numbers..."
"$BASE/tools/plugin-version.sh" -v "$NORMALIZED_VERSION" "$PLUGIN_DIR"
if [[ "$(git status --porcelain)" ]]; then
	git commit -am "Updated $PLUGIN_NAME version to $NORMALIZED_VERSION"
else
	debug "No version numbers needed updating."
fi

info "Versioning packages..."
"$BASE/tools/version-packages.sh" "$PLUGIN_DIR"
if [[ "$(git status --porcelain)" ]]; then
	git commit -am "Updated package versions for $PLUGIN_NAME"
else
	debug "No packages needed versioning."
fi

info <<-EOM
Release branch $BRANCH created! When ready, push to GitHub with

  git push -u origin "$BRANCH"

EOM

PUSH_MSG=" after you push"
if $INTERACTIVE; then
	if proceed_p "" "Check changes and push?"; then
		git log -p "$BASE_REF".."$BRANCH"
		if proceed_p "" "Push it now?"; then
			git push -u origin "$BRANCH"
			PUSH_MSG=
		fi
	fi
	echo ""
fi

if [[ "$MIRROR" ]]; then
	MIRROR_MSG="and pushed to $MIRROR when (if) it completes successfully"
else
	MIRROR_MSG="although no mirror repo is set up for $PLUGIN_NAME"
fi
fold -s <<-EOM
Remember that the build will be done by GitHub Actions$PUSH_MSG, $MIRROR_MSG. You'll probably want to watch to make sure that happens. This link should list the build jobs for the branch:
EOM
echo "https://github.com/Automattic/jetpack/actions?query=branch%3A$BRANCH+workflow%3ABuild"
