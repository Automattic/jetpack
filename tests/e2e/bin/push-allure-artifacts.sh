#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

ORG="brbrr"
REPO="test-dashboard-pages"
ROOT_DIR=$(pwd)
REPO_DIR=$ROOT_DIR/$REPO
RESULTS_DIR="allure-results"
USERNAME="jetpackbot"

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# master branch
	ARTIFACT="master"
elif [ ! "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# pull request
	ARTIFACT="pr-$TRAVIS_PULL_REQUEST"
else
	# other branch
	ARTIFACT=$(echo "$TRAVIS_BRANCH" | tr / _)
fi

REPORT_DIR="$REPO_DIR/docs/$ARTIFACT"
ARTIFACT_DIR="$REPO_DIR/$ARTIFACT"

git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"

git clone https://${USERNAME}:${GH_TEST_REPORT_TOKEN}@github.com/$ORG/$REPO.git

mkdir -p $ARTIFACT_DIR/allure-results $REPORT_DIR
cp -a $ROOT_DIR/$RESULTS_DIR/. $ARTIFACT_DIR/allure-results
cd $ARTIFACT_DIR
allure generate --clean -o $REPORT_DIR

if [ "$ARTIFACT" = "master" ]; then
	# master branch

	cd $REPO_DIR/docs
	rm -rf app.js data export favicon.ico history index.html plugins styles.css
	cp -a master/. ./
fi

# for PR:
#   mkdir -p pr-1111/allure-results docs/pr-1111
#   cp current-results pr-1111/allure-results
#   cd pr-1111
#   allure generate --clean -o ../docs/pr-1111
#
# for Branch
#   mkdir -p some-branch/allure-results docs/some-branch
#   cp current-results some-branch/allure-results
#   cd some-branch
#   allure generate --clean -o ../docs/some-branch
#
# for Master
#   mkdir -p master/allure-results docs/master
#   cp current-results master/allure-results
#   cd master
#   allure generate --clean -o ../docs/master

#   cd ../docs
#   rm -rf app.js data export favicon.ico history index.html plugins styles.css
#   cp -a master/. ./

cd $REPO_DIR

git status

git add docs
git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
git push
