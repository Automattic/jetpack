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
ARGS=()
VERSION=
TYPE=
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		--stable)
			TYPE="$1"
			shift
			;;
		--help)
			usage
			;;
		*)
			ARGS+=( "$arg" )
			;;
	esac
done
if [[ ${#ARGS[@]} -ne 1 ]]; then
	usage
fi

# This gets us $PLUGIN_DIR
# Do more checks to get any other plugin info we might need.
process_plugin_arg "${ARGS[0]}"

# Make sure we're standing on trunk and working directory is clean
CURRENT_BRANCH="$( git rev-parse --abbrev-ref HEAD )"
if [[ "$CURRENT_BRANCH" != "trunk" ]]; then
	# proceed_p "Not currently checked out to trunk." "Check out trunk before continuing?"
	# git checkout trunk && git pull
	echo "hi"
fi

if [[ "$(git status --porcelain)" ]]; then
	red "Working directory not clean, make sure you're working from a clean checkout and try again."
	#exit
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
echo "End of file"

# Run tools/changelogger-release.sh <plugin> [ -a, -b ] --add-pr-num
# When it completes, wait for user to edit anything then want, then push key to continue.
# If we're running a beta, amend the changelog.
# Push the changes, then tell the user to wait for the builds to complete and things to update.
# After this, run tools/create-release-branch.sh to create a release branch.