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
			--version <ver> What version we're releasing.  

	EOH
	exit 1
}


# Get the options passed and parse them.
# Process args.
ARGS=('-p')
VERSION=
ALPHABETA=
while getopts "v:abh" opt; do
	case ${opt} in
		v)
			VERSION=$OPTARG
		;;
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
			error "Invalid argument: -$OPTARG"
			echo ""
			usage
		;;
	esac
done
shift "$(($OPTIND -1))"

# Determine the project
[[ -z "$1" ]] && die "A project slug must be specified."
[[ $# -gt 1 ]] && die "Only one project slug must be specified, got:$(printf ' "%s"' "$@")"$'\n'"(note all options must come before the project slug)"
SLUG="${1#projects/}" # DWIM
SLUG="${SLUG%/}" # Sanitize
if [[ ! -e "$BASE/projects/$SLUG/composer.json" ]]; then
	die "Project $SLUG does not exist."
fi

# Make sure we're standing on trunk and working directory is clean
CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	# proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?"
	# git checkout trunk && git pull
	echo "fall through for testing"
fi

if [[ "$(git status --porcelain)" ]]; then
	red "Working directory not clean, make sure you're working from a clean checkout and try again."
fi

# Check out and push pre-release branch
BRANCHES="$( git branch )"
if [[ "$BRANCHES" =~ "prerelease-test" ]]; then
	proceed_p "Existing prerelease branch found." "Delete it?"
	git branch -D prerelease-test
fi

git checkout -b prerelease-test
if ! git push -u origin HEAD; then
	red "Branch push failed. Check #jetpack-releases and make sure no one is doing a release already, then delete the branch at https://github.com/Automattic/jetpack/branches"
fi

# Run tools/changelogger-release.sh [ -a, -b ] --add-pr-num <plugin> 
tools/changelogger-release.sh "${ARGS[@]}" "${SLUG}"

# When it completes, wait for user to edit anything then want, then push key to continue.
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

git push -u origin prerelease-test
echo "End of file"



.
# Push the changes, then tell the user to wait for the builds to complete and things to update.
# After this, run tools/create-release-branch.sh to create a release branch.