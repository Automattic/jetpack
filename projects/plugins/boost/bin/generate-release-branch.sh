#!/bin/bash
set -e

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT_DIR=$(dirname "$SCRIPT_DIR")

TARGET_VERSION=${1}

if [ -z "$TARGET_VERSION" ]
then
  echo >&2 "Version argument is required, e.g. 'npm run release:branch -- 1.0-beta3'. Aborting."; exit 1;
fi

TARGET_BRANCH="branch/${TARGET_VERSION}"

git ls-remote --exit-code --heads git@github.com:Automattic/jetpack-boost.git "${TARGET_BRANCH}" && { echo >&2 "Branch '${TARGET_BRANCH}' already exists at origin. Aborting."; exit 1; }

cd $REPO_ROOT_DIR

CHECK_MARK="\033[0;32m\xE2\x9C\x94\033[0m"

if [ `git branch --list ${TARGET_BRANCH}` ]
then
  echo "Branch '${TARGET_BRANCH}' exists locally. You can delete this branch with `git branch -d ${TARGET_BRANCH}`"
  exit 1;
else
  echo -n "  Creating the '${TARGET_BRANCH}' branch." && git checkout -b ${TARGET_BRANCH} --quiet && echo -e "\\r${CHECK_MARK} Successfully created the '${TARGET_BRANCH}' branch."
fi

# update required files for release
$SCRIPT_DIR/version-files.sh $TARGET_VERSION && echo -e "\\r${CHECK_MARK} Successfully updated file strings to version $TARGET_VERSION."
$SCRIPT_DIR/version-packages.sh && echo -e "\\r${CHECK_MARK} Successfully updated Jetpack DNA packages to latest stable versions."

# update composer deps
echo -n "  Updating Composer dependencies." && composer update --no-interaction --prefer-dist --no-progress --no-dev --no-scripts -q && echo -e "\\r${CHECK_MARK} Successfully updated Composer dependencies."

git add .
git commit -m "Branch for version $TARGET_VERSION"
git push --no-verify --set-upstream origin ${TARGET_BRANCH}

echo -e "\\r${CHECK_MARK} All done! You can build a zip of this release by running 'npm run release:build -- ${TARGET_BRANCH}'"
