#!/usr/bin/env bash

# This script requires Bash 4+, since we want a version of Bash that supports globstar.
if [ -z "${BASH_VERSINFO}" ] || [ -z "${BASH_VERSINFO[0]}" ] || [ ${BASH_VERSINFO[0]} -lt 4 ]; then
	echo "This script requires Bash version >= 4."
	read -p "Do you want to install it on your system with Homebrew? [y/N]" -n 1 -r
	if [[ $REPLY != "y" && $REPLY != "Y" ]]; then
		exit 1;
	else
		brew install bash 2>/dev/null
		echo "Done!"
	fi
fi

if [ $# -eq 0 ]; then
	echo 'Usage: `./deploy-to-svn.sh <tag | HEAD>`'
	exit 1
fi

JETPACK_GIT_DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )
JETPACK_SVN_DIR="/tmp/jetpack"
TARGET=$1

cd $JETPACK_GIT_DIR

# Make sure we don't have uncommitted changes.
if [[ -n $( git status -s --porcelain ) ]]; then
	echo "Uncommitted changes found."
	echo "Please deal with them and try again clean."
	exit 1
fi

if [ "$1" != "HEAD" ]; then

	# Make sure we're trying to deploy something that's been tagged. Don't deploy non-tagged.
	if [ -z $( git tag | grep "^$TARGET$" ) ]; then
		echo "Tag $TARGET not found in git repository."
		echo "Please try again with a valid tag."
		exit 1
	fi
else
	read -p "You are about to deploy a change from an unstable state 'HEAD'. This should only be done to update string typos for translators. Are you sure? [y/N]" -n 1 -r
	if [[ $REPLY != "y" && $REPLY != "Y" ]]
	then
		exit 1
	fi
fi

git checkout $TARGET

# Prep a home to drop our new files in. Just make it in /tmp so we can start fresh each time.
rm -rf $JETPACK_SVN_DIR

echo "Checking out SVN shallowly to $JETPACK_SVN_DIR"
svn -q checkout https://plugins.svn.wordpress.org/jetpack/ --depth=empty $JETPACK_SVN_DIR
echo "Done!"

cd $JETPACK_SVN_DIR

echo "Checking out SVN trunk to $JETPACK_SVN_DIR/trunk"
svn -q up trunk
echo "Done!"

echo "Checking out SVN tags shallowly to $JETPACK_SVN_DIR/tags"
svn -q up tags --depth=empty
echo "Done!"

echo "Deleting everything in trunk except for .svn directories"
for file in $(find $JETPACK_SVN_DIR/trunk/* -not -path "*.svn*"); do
	rm $file 2>/dev/null
done
echo "Done!"

echo "Rsync'ing everything over from Git except for .git stuffs"
rsync -r --exclude='*.git*' $JETPACK_GIT_DIR/* $JETPACK_SVN_DIR/trunk
echo "Done!"

echo "Purging .po files"
rm -f $JETPACK_SVN_DIR/trunk/languages/*.po
echo "Done!"

echo "Purging paths included in .svnignore"
# check .svnignore
shopt -s globstar # Support globs.
for file in $( cat "$JETPACK_GIT_DIR/.svnignore" 2>/dev/null ); do
	rm -rf $JETPACK_SVN_DIR/trunk/$file
done
echo "Done!"

echo "Remove empty directories"
for empty_dir in $( find $JETPACK_SVN_DIR/trunk/* -type d -empty); do
	rm -rf $empty_dir
done
echo "Done!"

echo "Generating Jetpack CDN Manifest"
php ./trunk/bin/build-asset-cdn-json.php
echo "Done!"

# Tag the release.
# svn cp trunk tags/$TARGET

# Change stable tag in the tag itself, and commit (tags shouldn't be modified after comitted)
# perl -pi -e "s/Stable tag: .*/Stable tag: $TARGET/" tags/$TARGET/readme.txt
# svn ci

# Update trunk to point to the freshly tagged and shipped release.
# perl -pi -e "s/Stable tag: .*/Stable tag: $TARGET/" trunk/readme.txt
# svn ci
