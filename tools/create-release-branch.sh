#!/usr/bin/env bash

set -eo pipefail
shopt -s inherit_errexit

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/changelogger.sh"
. "$BASE/tools/includes/alpha-tag.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/version-compare.sh"

# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> [<version>]

		Create a new release branch for the specified plugin.
		The <plugin> may be the name of a directory in projects/plugins/
		or a path to a plugin directory or file.

		If no <version> is specified (and we're not non-interactive), you will be
		prompted.

		Options:
		  --non-interactive  Exit instead of prompting for questionable cases.
	EOH
	exit 1
}

# Run a command and check if output is empty/non-empty
function isnotempty {
	local TMP
	TMP=$("$@") || exit $?
	[[ -n "$TMP" ]]
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
if [[ ${#ARGS[@]} -ne 1 && ${#ARGS[@]} -ne 2 ]]; then
	usage
fi

process_plugin_arg "${ARGS[0]}"
NAME=$(jq --arg n "${ARGS[0]}" -r '.name // $n' "$PLUGIN_DIR/composer.json")
PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' "$PLUGIN_DIR/composer.json")
if [[ -z "$PREFIX" ]]; then
	die "Plugin $NAME does not have a release branch prefix defined in composer.json. Aborting."
fi
MIRROR=$(jq -r '.extra["mirror-repo"] // ""' "$PLUGIN_DIR/composer.json")
info "Releasing plugin: $NAME"

info "Checking working directory status..."
# shellcheck disable=SC2310
if isnotempty git status --porcelain; then
	die "Working directory is not clean. Aborting."
fi

# Make sure we're on the prerelease branch, or at least that the user is fine with it.
git fetch
TMP=$(git rev-parse --abbrev-ref HEAD)
if [[ "$TMP" != "prerelease" ]]; then
	# shellcheck disable=SC2310
	if proceed_p "Current branch is $TMP." "Check out prerelease branch?"; then
		git checkout prerelease
	else
		proceed_p " " "Continue anyway?"
	fi
fi
COMMITS=$(git log HEAD.. --oneline)
if [[ -n "$COMMITS" ]]; then
	TMP=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}')
	info "The current branch is behind $TMP."
	echo "$COMMITS"
	# shellcheck disable=SC2310
	if proceed_p "" "Pull?" Y; then
		git pull
	else
		proceed_p " " "Continue anyway?"
	fi
fi

# Figure out the version to use for the plugin.
function check_ver {
	normalize_version_number "$1"
	if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		return 1
	fi
	local CUR_VERSION
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PLUGIN_DIR")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION" 1; then
		proceed_p "Version $NORMALIZED_VERSION < $CUR_VERSION."
		return $?
	fi
	return 0
}
VERSION=
if [[ -n "${ARGS[1]}" ]]; then
	check_ver "${ARGS[1]}"
	info "Using version number $NORMALIZED_VERSION for plugin $NAME"
	VERSION=$NORMALIZED_VERSION
else
	# Prompt for the version.
	$INTERACTIVE || die "Cannot prompt for a version when running in non-interactive mode!"
	CHANGES_DIR="$PLUGIN_DIR/$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' "$PLUGIN_DIR/composer.json")"
	if [[ -d "$CHANGES_DIR" && "$(ls -- "$CHANGES_DIR")" ]]; then
		PRERELEASE=$(cd "$PLUGIN_DIR" && alpha_tag composer.json 0)
		VER=$(cd "$PLUGIN_DIR" && changelogger version next --default-first-version --prerelease="$PRERELEASE") || die "$VER"
	else
		VER=$(cd "$PLUGIN_DIR" && changelogger version current --default-first-version) || die "$VER"
	fi

	PROMPT="Version to use for plugin $NAME:"
	# shellcheck disable=SC2310
	if color_supported; then
		PROMPT=$(FORCE_COLOR=1 prompt "$PROMPT")
	fi
	while [[ -z "$VERSION" ]]; do
		IFS= read -e -i "$VER" -p "$PROMPT " -r LINE || die "Aborting!"
		[[ -z "$LINE" ]] && LINE=$VER
		# shellcheck disable=SC2310
		if [[ -n "$LINE" ]] && check_ver "$LINE"; then
			VERSION=$NORMALIZED_VERSION
		fi
	done
fi

# See if the release branch already exists.
BRANCH="$PREFIX/branch-$VERSION"
# shellcheck disable=SC2310
if isnotempty git ls-remote --heads origin "$BRANCH"; then
	die "Release branch $BRANCH has already been pushed. Aborting."
elif isnotempty git branch --list "$BRANCH"; then
	proceed_p "Release branch $BRANCH already exists locally, but has not been pushed." "Delete it?" Y
	git branch -D "$BRANCH"
fi

BASE_REF="$(git rev-parse --abbrev-ref HEAD)"
info "Creating release branch $BRANCH based on $BASE_REF..."
git checkout -b "$BRANCH"

info "Updating version numbers for $NAME..."
"$BASE/tools/plugin-version.sh" -v "$VERSION" "$PLUGIN_DIR"
# shellcheck disable=SC2310
if isnotempty git status --porcelain; then
	git commit -am "Updated $NAME version to $VERSION"
else
	debug "No version numbers needed updating."
fi

info "Versioning packages for $NAME..."
"$BASE/tools/version-packages.sh" "$PLUGIN_DIR"
# shellcheck disable=SC2310
if isnotempty git status --porcelain; then
	git commit -am "Updated package versions for $NAME"
else
	debug "No packages needed versioning."
fi

info <<-EOM
Release branch $BRANCH created! When ready, push to GitHub with

  git push -u origin "$BRANCH"

EOM

PUSH_MSG=" after you push"
if $INTERACTIVE; then
	# shellcheck disable=SC2310
	if proceed_p "" "Check changes and push?" Y; then
		git log -p "$BASE_REF".."$BRANCH" || true
		# shellcheck disable=SC2310
		if proceed_p "" "Push it now?" Y; then
			git push -u origin "$BRANCH"
			PUSH_MSG=
		fi
	fi
	echo ""
fi

if [[ -n "$MIRROR" ]]; then
	MIRROR_MSG="and pushed to $MIRROR when (if) it completes successfully"
else
	MIRROR_MSG="although no mirror repo is set up for $NAME"
fi
fold -s <<-EOM
Remember that the build will be done by GitHub Actions$PUSH_MSG, $MIRROR_MSG. You'll probably want to watch to make sure that happens. This link should list the build jobs for the branch:
EOM
echo "https://github.com/Automattic/jetpack/actions?query=branch%3A$BRANCH+workflow%3ABuild"
