#!/bin/bash

git_setup()
{
  cat <<- EOF > "$HOME/.netrc"
		machine github.com
			login matticbot
			password $GITHUB_TOKEN
		machine api.github.com
			login matticbot
			password $GITHUB_TOKEN
EOF
  chmod 600 "$HOME/.netrc"

  git config --global user.email "matticbot@users.noreply.github.com"
  git config --global user.name "matticbot"
}

# Halt on error
set -e

git_setup

BASE=$(pwd)
MONOREPO_COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)
COMMIT_MESSAGE=$( echo "${MONOREPO_COMMIT_MESSAGE}\n\nCommitted via a GitHub action: https://github.com/automattic/jetpack/runs/${GITHUB_RUN_ID}" )
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

echo "Cloning Jetpack Debug Helper"

# sync to read-only clones

git clone --depth 1 https://$API_TOKEN_GITHUB@github.com/automattic/jetpack-debug-helper.git

cd jetpack-debug-helper

find . | grep -v ".git" | grep -v "^\.*$" | xargs rm -rf # delete all files (to handle deletions in monorepo)

echo "  Copying from ${BASE}/docker/mu-plugins/jetpack-debug-helper/."

cp -r $BASE/docker/mu-plugins/jetpack-debug-helper/. .

echo "  Committing to mirror repository"
git add -A
git commit --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}"
git push origin master
echo "  Completed"
