#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"
. "$BASE/tools/includes/version-compare.sh"
. "$BASE/tools/includes/normalize-version.sh"
. "$BASE/tools/includes/changelogger.sh"


# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin> <version>

		Conduct a full release of a specified plugin through release branch creation. Just the plugin name is fine, such as 'jetpack' or 'backup.' The version is optional, and if not specified, will be set to the next stable version.

		Options:
			-h Show this help message.
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
while getopts "h" opt; do
	case ${opt} in
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

# Parse arguments in associated array of plugins/project => version format.
if [ $# -eq 0 ]; then
	usage
fi

declare -A PROJECTS
while [[ $# -gt 0 ]]; do
	if [[ "$1" =~ ^[a-zA-Z\-]+$ ]]; then
		PLUGIN=$1
	else
		die "Script must be passed in <project> [version] format. Got $1"
	fi
	
	if [[ "$2" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		PROJECTS["$PLUGIN"]=$2
		SHIFT="2"
	else
		PROJECTS["$PLUGIN"]=''
		SHIFT="1"
	fi
	shift "$SHIFT"
done

# If we're releasing Jetpack, we're also releasing mu-wpcom-plugin.
if [[ -n "${PROJECTS[jetpack]+ok}" && -z "${PROJECTS[mu-wpcom-plugin]+ok}" ]]; then
	PROJECTS["mu-wpcom-plugin"]=''
fi

# Check that the projects are valid.
for PLUGIN in "${!PROJECTS[@]}"; do
	# Get the project slug.
	SLUG="${PLUGIN#projects/}" # DWIM
	SLUG="${SLUG%/}" # Sanitize
	SLUG="plugins/$SLUG"
	if [[ -e "$BASE/projects/$SLUG/composer.json" ]]; then
		PROJECTS["$SLUG"]="${PROJECTS[$PLUGIN]}"
		unset "PROJECTS[$PLUGIN]"
	else 
		die "$SLUG isn't a valid project!"
	fi
done

# Try to obtain a version number for plugins that we didn't supply.
for SLUG in "${!PROJECTS[@]}"; do
	cd "$BASE"
	if [[ -z "${PROJECTS[$SLUG]}" ]]; then
		cd "projects/$SLUG"
		PROJECTS["$SLUG"]=$(changelogger version next)
	fi
done

# Check the plugin version(s) to use for the plugin(s).
function check_ver {
	normalize_version_number "$2"
	if [[ ! "$NORMALIZED_VERSION" =~ ^[0-9]+(\.[0-9]+)+(-.*)?$ ]]; then
		red "\"$NORMALIZED_VERSION\" does not appear to be a valid version number."
		return 1
	fi
	local CUR_VERSION
	CUR_VERSION=$("$BASE/tools/plugin-version.sh" "$1")
	# shellcheck disable=SC2310
	if version_compare "$CUR_VERSION" "$NORMALIZED_VERSION"; then
		proceed_p "Version $NORMALIZED_VERSION <= $CUR_VERSION."
		return $?
	fi
	return 0
}

for PLUGIN in "${!PROJECTS[@]}"; do
	if ! check_ver "$PLUGIN" "${PROJECTS[$PLUGIN]}"; then
		die "Please specify a valid version number."
	fi
	echo "Releasing $PLUGIN ${PROJECTS[$PLUGIN]}"
done

proceed_p "" "Proceed releasing above projects?"


# Get the release branches for the projects.
declare -A PREFIXES
for SLUG in "${!PROJECTS[@]}"; do
	PREFIX=$(jq -r '.extra["release-branch-prefix"] // ""' "$BASE"/projects/"$SLUG"/composer.json)
	if [[ -n "$PREFIX" ]] && [[ ! "${PREFIXES[*]}" =~ $PREFIX ]]; then
		PREFIXES["$PREFIX"]=${PROJECTS[$SLUG]}
	elif [[ -z "$PREFIX" ]]; then
		die "No release branch prefix found for $SLUG, aborting."
	fi
done

# Check if release branches already exist.
RELEASE_BRANCH=
for PREFIX in "${!PREFIXES[@]}"; do
	RELEASE_BRANCH="$PREFIX/branch-${PREFIXES[$PREFIX]%%-*}"
	REMOTE_BRANCH="$(git ls-remote origin "$RELEASE_BRANCH")"
	if [[ -n "$REMOTE_BRANCH" ]]; then
		proceed_p "Existing release branch $RELEASE_BRANCH found." "Delete it before continuing?"
		git push origin --delete "$RELEASE_BRANCH"
	fi
done

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

# Loop through the projects and update the changelogs after building the arguments.
for PLUGIN in "${!PROJECTS[@]}"; do
	yellow "Updating the changelog files for $PLUGIN."

	# Add the PR numbers to the changelog.
	ARGS=('-p')
	
	# Add alpha and beta flags.
	VERSION="${PROJECTS[$PLUGIN]}"
	case $VERSION in
		*-a* ) ARGS+=('-a');;
		*-beta ) ARGS+=('-b');;
	esac

	# Explicitly pass the version number we want so there are no surprises.
	ARGS+=( '-r' "${PROJECTS[$PLUGIN]}" )
	ARGS+=("$PLUGIN");
	tools/changelogger-release.sh "${ARGS[@]}"
done

# When it completes, wait for user to edit anything they want, then push key to continue.
read -r -s -p $'Edit all the changelog entries you want (in a separate terminal or your text editor of choice (make sure to save)), then press enter when finished to continue the release process.'
echo ""

yellow "Committing changes."
git add --all
git commit -am "Changelog edits."

# If we're releasing Jetpack and it's a beta, amend the readme.txt
if [[ -v PROJECTS["plugins/jetpack"] && "${PROJECTS[plugins/jetpack]}" == *-beta ]]; then
	yellow "Releasing a beta for Jetpack, amending the readme.txt"
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

yellow "Build is complete."
# Run tools/create-release-branch.sh to create a release branch for each project.
for PREFIX in "${!PREFIXES[@]}"; do
	git checkout prerelease
	VERSION="${PREFIXES[$PREFIX]}"
	PROJECT="$PREFIX"
	yellow "Creating release branch for $PROJECT $VERSION"
	tools/create-release-branch.sh "$PROJECT" "$VERSION"
done

yellow "Release branches created!"
