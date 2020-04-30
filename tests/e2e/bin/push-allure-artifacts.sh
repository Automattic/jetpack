#!/usr/bin/env bash

set -ex

ORG="brbrr"
REPO="test-dashboard-pages"
ROOT_DIR=$(pwd)
REPO_DIR=$ROOT_DIR/$REPO
RESULTS_DIR="allure-results"
USERNAME="jetpackbot"

git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"
git clone https://${USERNAME}:${GH_TEST_REPORT_TOKEN}@github.com/$ORG/$REPO.git

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# master branch
	ARTIFACT="master"
elif [ ! "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# pull request
	ARTIFACT="pr-$TRAVIS_PULL_REQUEST"
else
	# other branch. replace / with _
	ARTIFACT=$(echo "$TRAVIS_BRANCH" | tr / _)
fi

##
# Dashboard repo configured to serve static files from `/docs` folder
# The above script allows us to maintain the following site/content structure (site path vs folders):
#		/ => /docs (this is a master branch)
#		/pr-1234 => /docs/pr-1234
#		/branch-name => /docs/branch-name (works for both master and other branches)
#
# What this script does is basically moves new test results into existing results from previous builds into $ARTIFACT_DIR
# This allows us to generate the report with previous build history.
#
# Master branch is a bit of special case, since we want to serve it from /master and / and the limitation of `allure generate` which unable to generate into dirty folder. We need to copy /docs/master into /docs to handle it
##

REPORT_DIR="$REPO_DIR/docs/$ARTIFACT"
ARTIFACT_DIR="$REPO_DIR/$ARTIFACT"

mkdir -p $ARTIFACT_DIR/allure-results $REPORT_DIR
cp -a $ROOT_DIR/$RESULTS_DIR/. $ARTIFACT_DIR/allure-results
cd $ARTIFACT_DIR
allure generate --clean -o $REPORT_DIR

if [ "$ARTIFACT" = "master" ]; then
	cd $REPO_DIR/docs
	rm -rf app.js data export favicon.ico history index.html plugins styles.css
	cp -a master/. ./
fi

cd $REPO_DIR

# Push the changes
git add .
git commit -q --message "Build for $ARTIFACT. Travis build# $TRAVIS_BUILD_NUMBER."
git push

# TODO move it before push, once it we can confirm it's doing the right thing
# Remove folders older then 30 days
# find . -type d -mtime +30 -maxdepth 1 | xargs rm -rf
find . -type d -mtime +30 -maxdepth 1
find ./docs -type d -mtime +30 -maxdepth 1

