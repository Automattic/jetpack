#!/bin/bash
set -e

# *** USE WITH CAUTION *** deletes both local AND remote branches for a release

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT_DIR=$(dirname "$SCRIPT_DIR")
CHECK_MARK="\033[0;32m\xE2\x9C\x94\033[0m"
TARGET_VERSION=${1}

if [ -z "$TARGET_VERSION" ]
then
  echo >&2 "Version argument is required, e.g. 'npm run release:delete -- 1.0-beta3'. Aborting."; exit 1;
fi

TARGET_BRANCH="branch/${TARGET_VERSION}"

if [[ ! -z `git ls-remote --exit-code --heads git@github.com:Automattic/jetpack-boost.git "${TARGET_BRANCH}"` ]]
then
  echo "Branch '${TARGET_BRANCH}' exists at origin. Deleting."
  git push origin --delete ${TARGET_BRANCH}
  echo -e "\\r${CHECK_MARK} Branch '${TARGET_BRANCH}' deleted at origin."
else
  echo "Branch '${TARGET_BRANCH}' does not exist at origin. Skipping."
fi

cd $REPO_ROOT_DIR

if [[ ! -z `git branch --list ${TARGET_BRANCH}` ]]
then
  echo "Branch '${TARGET_BRANCH}' exists locally. Deleting."
  git branch -D ${TARGET_BRANCH}
  echo -e "\\r${CHECK_MARK} Branch '${TARGET_BRANCH}' deleted locally."
else
  echo "Branch '${TARGET_BRANCH}' does not exist locally. Skipping."
fi

echo -e "\\r${CHECK_MARK} All done!"
