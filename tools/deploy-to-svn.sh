#!/bin/bash

if [ $# -eq 0 ]; then
	echo 'Usage: `./deploy-to-svn.sh <tag>`'
	exit 1
fi

JETPACK_GIT_DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )
JETPACK_SVN_DIR="/tmp/jetpack"
TAG=$1

cd $JETPACK_GIT_DIR

# Make sure we're trying to deploy something that's been tagged. Don't deploy non-tagged.
if [ -z $( git tag | grep "^$TAG$" ) ]; then
	echo "Tag $TAG not found in git repository."
	echo "Please try again with a valid tag."
	exit 1
fi

# Make sure we don't have uncommitted changes.
if [[ -n $( git status -s --porcelain ) ]]; then
	echo "Uncommitted changes found."
	echo "Please deal with them and try again clean."
	exit 1
fi

git checkout $TAG

# Prep a home to drop our new files in. Just make it in /tmp so we can start fresh each time.
rm -rf $JETPACK_SVN_DIR
svn checkout http://plugins.svn.wordpress.org/jetpack/ --depth=empty $JETPACK_SVN_DIR
cd $JETPACK_SVN_DIR
svn up trunk
svn up tags --depth=empty

# delete everything except .svn dirs
for file in $(find $JETPACK_SVN_DIR/trunk/* -not -path "*.svn*"); do
	rm $file 2>/dev/null
done

# copy everything over from git
rsync -r --exclude='*.git*' $JETPACK_GIT_DIR/* $JETPACK_SVN_DIR/trunk

# check .svnignore
for file in $( cat "$JETPACK_GIT_DIR/.svnignore" 2>/dev/null ); do
	rm trunk/$file -rf
done

# Tag the release.
# svn cp trunk tags/$TAG

# Change stable tag in the tag itself, and commit (tags shouldn't be modified after comitted)
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" tags/$TAG/readme.txt
# svn ci

# Update trunk to point to the freshly tagged and shipped release.
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" trunk/readme.txt
# svn ci