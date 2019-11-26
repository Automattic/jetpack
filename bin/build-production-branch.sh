#!/bin/bash

#
# This script will build a production-ready version of any branch.
# It takes no parameters (yet)
#
# The source branch must already exist, and have a `branch-X.X` syntax.
#
# It will build a production-ready version to a branch named `branch-X.X-built`.
#

# Checking for composer
hash composer 2>/dev/null || {
    echo >&2 "This script requires you to have composer package manager installed."
    echo >&2 "Please install it following the instructions on https://getcomposer.org/. Aborting.";
    exit 1;
}

# Checking for yarn
hash yarn 2>/dev/null || {
	echo >&2 "This script requires you to have yarn package manager installed."
	echo >&2 "Please install it following the instructions on https://yarnpkg.com. Aborting.";
	exit 1;
}

# Prompt for version number.
read -p "What version are you releasing? Please write in x.x syntax. Example: 4.9 - " VERSION

# Declare the new branch names.
PULL_BRANCH="branch-$VERSION"
PUSH_BRANCH="branch-$VERSION-built"

# Current directory
DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )

# Temp build dir
TMP_BUILD="/tmp/jetpack-prod"
rm -rf $TMP_BUILD

git clone git@github.com:Automattic/jetpack.git --depth=1 $TMP_BUILD

# Make sure we're trying to deploy something that exists.
if [[ -z $( git branch -r | grep "origin/$PULL_BRANCH" ) ]]; then
	echo "Branch $PULL_BRANCH not found in git repository."
	echo ""
	exit 1
fi

read -p "You are about to deploy a new production build to the $PUSH_BRANCH branch from the $PULL_BRANCH branch. Are you sure? [y/N]" -n 1 -r
if [[ $REPLY != "y" && $REPLY != "Y" ]]; then
	exit 1
fi
echo ""

echo "Building Jetpack"

git remote update
git fetch --all

# Will create branch if it does not exist
if [[ $( git branch -r | grep "origin/$PUSH_BRANCH" ) ]]; then
   git checkout $PUSH_BRANCH
else
   git checkout -b $PUSH_BRANCH
   git push --set-upstream origin $PUSH_BRANCH
fi

git reset --hard "origin/$PULL_BRANCH"

# Make sure to build with versioned packages.
yarn version-packages

# Run the money build.
yarn build-production

# Purge the things
bin/prepare-built-branch.sh

# Commit and push
git add .
git commit -m "Update from $PULL_BRANCH"
git push -f
