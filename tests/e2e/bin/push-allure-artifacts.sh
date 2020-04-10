#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

ORG="brbrr"
REPO="test-dashboard-pages"
ROOT_DIR=$(pwd)
REPO_DIR=$ROOT_DIR/$REPO
RESULTS_DIR="allure-results"
USERNAME="jetpackbot"

git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# master branch
	REPORT_DIR="docs"
elif [ ! "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# pull request
	REPORT_DIR="docs/pr-$TRAVIS_PULL_REQUEST"
else
	# other branch
	BRANCH=$(echo "$TRAVIS_BRANCH" | tr / _)
	REPORT_DIR="docs/$BRANCH"
fi

git clone https://${USERNAME}:${GH_TEST_REPORT_TOKEN}@github.com/$ORG/$REPO.git

ls -la $RESULTS_DIR

cp -a $RESULTS_DIR/. $REPO/$REPORT_DIR/$RESULTS_DIR

cd $REPO_DIR/$REPORT_DIR

allure generate --clean -o .

ls -la

cd $REPO_DIR

git status

git add docs
git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
git push
