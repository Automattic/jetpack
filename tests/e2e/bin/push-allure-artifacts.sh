#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

ORG="brbrr"
REPO="test-dashboard-pages"

RESULTS_DIR="allure-results"
USERNAME="jetpackbot"

git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"

git clone https://${USERNAME}:${GH_TEST_REPORT_TOKEN}@github.com/$ORG/$REPO.git
cd $REPO

if [ "$TRAVIS_BRANCH" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# master branch
	REPORT_DIR="docs"
elif [ ! "$TRAVIS_PULL_REQUEST" = "false" ]; then
	# pull request
	REPORT_DIR="docs/PR-$TRAVIS_PULL_REQUEST"
else
	# other branch
	BRANCH=$(echo "$TRAVIS_BRANCH" | tr / _)
	REPORT_DIR="docs/$BRANCH"
fi

ls -la $RESULTS_DIR

allure generate

cp -a $RESULTS_DIR/. $REPORT_DIR
ls -la $RESULTS_DIR

git status

git add allure-results docs
git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
git push
