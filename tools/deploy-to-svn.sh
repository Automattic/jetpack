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
if [ -z $( git status -s ) ]; then
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

# Delete files in the SVN repo that are no longer in the Git repo.
SVN_FILES=$( cd trunk && find . -type f )
GIT_FILES=$( cd $JETPACK_GIT_DIR && find . -type f )
RM_FILES=$(diff -B <( echo "$SVN_FILES" ) <( echo "$GIT_FILES" ) | grep "^<.*" | cut -d ' ' -f 2 )
if [ -z "$RM_FILES" ]; then
	echo "No deleted files."
else
	for THIS_FILE in $RM_FILES
	do
		( cd trunk && svn rm $THIS_FILE )
		echo "Removed $THIS_FILE to match source."
	done
fi

# Copy our whole git checkout here recursively.
cp -rf $JETPACK_GIT_DIR/* trunk

# Snag the dot-files as well.
cp -rf $JETPACK_GIT_DIR/.??* trunk

# Delete files that don't need to be deployed with the plugin release.
rm -rf trunk/.git trunk/.gitignore trunk/.jshintrc trunk/.jshintignore trunk/.sass-cache trunk/Gruntfile.js trunk/_inc/scss trunk/_inc/*.scss trunk/.travis.yml trunk/package.json trunk/languages/jetpack.pot trunk/phpunit.xml.dist trunk/readme.md trunk/node_modules trunk/tests trunk/tools

# Upcoming Events isn't ready for primetime yet.
rm -rf trunk/_inc/lib/icalendar-reader.php trunk/modules/shortcodes/upcoming-events.php trunk/modules/widgets/upcoming-events.php

# Tag the release.
# svn cp trunk tags/$TAG

# Change stable tag in the tag itself, and commit (tags shouldn't be modified after comitted)
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" tags/$TAG/readme.txt
# svn ci

# Update trunk to point to the freshly tagged and shipped release.
# perl -pi -e "s/Stable tag: .*/Stable tag: $TAG/" trunk/readme.txt
# svn ci