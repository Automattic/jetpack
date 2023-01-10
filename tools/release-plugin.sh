#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/tools/includes/proceed_p.sh"
. "$BASE/tools/includes/plugin-functions.sh"


# Instructions
function usage {
	cat <<-EOH
		usage: $0 [options] <plugin>

		Conduct a full release of a specified plugin. The <plugin> may be
		either the name of a directory in projects/plugins/, or a path to a plugin directory or file.

		Options:
			--stable <stable> If we're releasing a stable.
			--beta <beta> If we're releasing a beta
			--alpha <alpha> If we're releasing an alpha version

	EOH
	exit 1
}

# Get the options passed and parse them.
ARGS=('-p')
VERSION=
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

# If there are two arguments left, parse them to get the project slug and the version number.
[[ $# -gt 2 ]] && die "Too many arguments specified! A project and a version number. Got:$(printf ' "%s"' "$@")"$'\n'"(note all options must come before the project slug)"
# If there is only one argument, it should be the project slug, then we must prompt for the version.
# Normalize the version. 

# Determine the project
[[ -z "$1" ]] && die "A project slug must be specified."

SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
	die "Project $SLUG does not exist."
fi

# Make sure we're standing on trunk and working directory is clean
CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?"
	git checkout trunk && git pull
fi

if [[ "$(git status --porcelain)" ]]; then
	red "Working directory not clean, make sure you're working from a clean checkout and try again."
fi

# Check out and push pre-release branch
BRANCHES="$( git branch )"
if [[ "$BRANCHES" =~ "prerelease" ]]; then
	proceed_p "Existing prerelease branch found." "Delete it?"
	git branch -D prerelease
fi

git checkout -b prerelease
if ! git push -u origin HEAD; then
	red "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
fi

# Run the changelogger release script
tools/changelogger-release.sh "${ARGS[@]}" "${SLUG}"

# When it completes, wait for user to edit anything they want, then push key to continue.
read -r -s -p $'Edit any changelog entries you want, then press enter to continue the release process.'
echo ""

git add --all
git commit -am "Changelog edits for $SLUG"

# If we're running a beta, amend the changelog
if [[ "$SLUG" == "projects/jetpack" && "$ALPHABETA" == "-b" ]]; then
	echo "Releasing a beta, amending the readme.txt"
	jetpack changelog squash plugins/jetpack readme
	git commit -am "Amend readme.txt"
fi

# Push the changes, then tell the user to wait for the builds to complete and things to update.
git push -u origin prerelease

yellow "Waiting for build to complete and push to mirror repos"
BUILDID="$( gh run list --json headBranch,event,databaseId,workflowName --jq '.[] | select(.event=="push" and .headBranch=="prerelease" and .workflowName=="Build") | .databaseId' )"
if ! gh run watch "${BUILDID[0]}" --exit-status; then
	echo "Build failed! Check for build errors on GitHub for more information."
fi 


# After this, run tools/create-release-branch.sh to create a release branch.
yellow "Build is complete. Creating a release branch."
tools/create-release-branch.sh "${SLUG}"
