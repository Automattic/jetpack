#!/usr/bin/env bash
# see https://github.com/wp-cli/wp-cli/blob/master/templates/install-wp-tests.sh

set -ex


pwd

ls -la

DIR="test-dashboard-pages"
RESULTS_DIR="allure-results"
USERNAME="jetpackbot"

git config --global user.email "travis@travis-ci.org"
git config --global user.name "Travis CI"

git clone https://${USERNAME}:${GH_TEST_REPORT_TOKEN}@github.com/brbrr/$DIR.git

cd $DIR

ls -la $RESULTS_DIR

cp -R ../$RESULTS_DIR .

ls -la $RESULTS_DIR

allure generate

git status

git add .
git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
git push
