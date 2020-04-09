#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex

ORG="brbrr"
REPO="test-dashboard-pages"

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

allure generate --clean -o $REPO/$REPORT_DIR

cp -R $RESULTS_DIR $REPO/$REPORT_DIR

cd $REPO

git status

git add $RESULTS_DIR docs
git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
git push
