#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/version-compare.sh"
. "$BASE/tools/includes/normalize-version.sh"


# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> <version>

		Conduct a full release of a specified plugin through release branch creation. The <plugin> must be the slug of the plugin, such as plugins/jetpack

		Options:
			-a Release an alpha version
			-b Release a beta version
	EOH
	exit 1
}

# Make sure the GitHub CLI is installed.
if ! command -v gh &> /dev/null; then
	yellow "This tool requires the GitHub CLI, which was not found."
	if command -v brew &> /dev/null; then
		proceed_p "Install the GitHub CLI via brew?"
		brew install gh
	else
		die "Please install the GitHub CLI before proceeding"
	fi 
fi

GH_VER="$( gh --version | grep -E -o -m1 '[0-9]+\.[0-9]+\.[0-9]+' )"
if ! version_compare "$GH_VER" "2.21.2"; then
	command -v brew &> /dev/null && WITH=" with 'brew upgrade gh'" || WITH=
	die "Your version of the GH CLI is out of date. Please upgrade your version$WITH and start again"
fi

# Get the options passed and parse them.
ARGS=('-p')
ALPHABETA=
while getopts "v:abh" opt; do
	case ${opt} in
		a)
			ALPHABETA='-a'
			ARGS+=("$ALPHABETA")
		;;
		b)
			ALPHABETA='-b'
			ARGS+=("$ALPHABETA")
		;;
		h)
			usage
		;;
		?)
			error "Invalid argument"
			echo ""
			usage
		;;
	esac
done
shift "$(($OPTIND -1))"

# If there are more than two arguments, bail.
[[ $# -gt 2 ]] && die "Too many arguments specified! Only provide a project and a version number. Got:$(printf ' "%s"' "$@")"$'\n'"(note all options must come before the project slug)"

# Get the project slug.
PROJECT=
SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ -e "$BASE/projects/$SLUG/composer.json" ]]; then
	yellow "Project found: $SLUG"
	PROJECT="$SLUG"
fi
[[ -z "$PROJECT" ]] && die "A valid project slug must be specified (make sure project is in plugins/<project> format and comes before specifying version number."

# Determine the project version
[[ -z $2 ]] && die "Please specify a version number"
# Figure out the version(s) to use for the plugin(s).
function check_ver {
	normalize_version_number "$1"
	if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		return 1
	fi
	local CUR_VERSION
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$PROJECT")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION"; then
		proceed_p "Version $NORMALIZED_VERSION <= $CUR_VERSION."
		return $?
	fi
	return 0
}

if ! check_ver "$2"; then
	die "Please specify a valid version number."
fi
VERSION="$2"

# Bail if we're passing an alpha or beta flag but not including it in the version number and vice versa.
VERSION_AB=
if VERSION_AB="$(grep -o '-a\|-beta' <<< "$VERSION")"; then
	VERSION_AB="-${VERSION_AB:1:1}"
fi

if [[ -n "$ALPHABETA" ]]; then
	if [[ "$VERSION_AB" != "$ALPHABETA" || ! "$VERSION_AB" ]]; then
		die "$ALPHABETA passed to script, but version number $VERSION does not contain the corresponding flag."
	fi
elif [[ -n "$VERSION_AB" && -z "$ALPHABETA" ]]; then
	die "$VERSION contains alpha or beta flag, but corresponding flag was not passed to the script, i.e. tools/release-plugin.sh -b plugins/jetpack 11.6-beta."
fi

proceed_p "Releasing $PROJECT $VERSION" "Proceed?"

# Check if a remote branch for the release branch exits and ask to delete it if it does.
PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' "$BASE"/projects/"$PROJECT"/composer.json)
RELEASE_BRANCH=
if [[ -n "$PREFIX" ]]; then
	RELEASE_BRANCH="$PREFIX/branch-${VERSION%%-*}"
else
	die "No release branch prefix found for $PROJECT, aborting."
fi

REMOTE_BRANCH="$(git ls-remote origin "$RELEASE_BRANCH")"
if [[ -n "$REMOTE_BRANCH" ]]; then
	proceed_p "Existing release branch $RELEASE_BRANCH found." "Delete it before continuing?"
	git push origin --delete "$RELEASE_BRANCH"
fi

# Make sure we're standing on trunk and working directory is clean
CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?"
	git checkout trunk && git pull
fi

if [[ -n "$(git status --porcelain)" ]]; then
	die "Working directory not clean, make sure you're working from a clean checkout and try again."
fi

yellow "Checking out prerelease branch."
# Check out and push pre-release branch
if git rev-parse --verify prerelease &>/dev/null; then
	proceed_p "Existing prerelease branch found." "Delete it?"
	git branch -D prerelease
fi

git checkout -b prerelease
if ! git push -u origin HEAD; then
	die "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
fi

yellow "Updating the changelogs."
# Run the changelogger release script
tools/changelogger-release.sh "${ARGS[@]}" "$PROJECT"

# When it completes, wait for user to edit anything they want, then push key to continue.
read -r -s -p $'Edit all the changelog entries you want (in a separate terminal or your text editor of choice (make sure to save)), then press enter when finished to continue the release process.'
echo ""

yellow "Committing changes."
git add --all
git commit -am "Changelog edits for $PROJECT"

# If we're running a beta, amend the changelog
if [[ "$PROJECT" == "projects/jetpack" && "$ALPHABETA" == "-b" ]]; then
	yellow "Releasing a beta, amending the readme.txt"
	pnpm jetpack changelog squash plugins/jetpack readme
	git commit -am "Amend readme.txt"
fi

HEADSHA=$(git rev-parse HEAD)
yellow "Pushing changes."
git push -u origin prerelease

yellow "Waiting for build to complete and push to mirror repos"
BUILDID=

# If the build ID doesn't exist, try every five seconds until timeout after a minute.
TIMEOUT=$((SECONDS+60))
while [[ $SECONDS -lt $TIMEOUT &&  -z "$BUILDID" ]]; do
	echo "Waiting for build to become available..."
	sleep 5
	BUILDID="$( gh run list -b prerelease -w Build --json event,databaseId,headSha | jq --arg HEADSHA "$HEADSHA" '.[] | select(.event=="push" and .headSha==$HEADSHA) | .databaseId' )"
done

if [[ -z "$BUILDID" ]]; then
	die "Build ID not found. Check GitHub actions to see if build on prerelease branch is running, then continue with manual steps."
fi 

yellow "Build ID found, waiting for build to complete and push to mirror repos."
if ! gh run watch "${BUILDID[0]}" --exit-status; then
	echo "Build failed! Check for build errors on GitHub for more information." && die
fi

# After this, run tools/create-release-branch.sh to create a release branch.
yellow "Build is complete. Creating a release branch."
tools/create-release-branch.sh "$PROJECT" "$VERSION"

yellow "Release branch created!"
