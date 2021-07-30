#!/bin/bash
set -e

command -v zip >/dev/null 2>&1 || { echo >&2 "The required 'zip' command is not found on your system. Aborting."; exit 1; }

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT_DIR=$(dirname "$SCRIPT_DIR")

DIST_FOLDER="release"
PLUGIN_DIST_DIR="jetpack-boost-dist"
GIT_BRANCH=${1:-trunk}

cd $REPO_ROOT_DIR

CHECK_MARK="\033[0;32m\xE2\x9C\x94\033[0m"

echo -n "  Cleaning the '${DIST_FOLDER}' directory." && rm -rf "./${DIST_FOLDER}" "./${PLUGIN_DIST_DIR}" && mkdir "./${DIST_FOLDER}" && echo -e "\\r${CHECK_MARK} Successfully cleaned up the '${DIST_FOLDER}' directory."

echo -n "  Switching to the '${GIT_BRANCH}' branch or tag." && git checkout ${GIT_BRANCH} --quiet && echo -e "\\r${CHECK_MARK} Successfully switched to the '${GIT_BRANCH}' branch or tag."

PLUGIN_VERSION=$(grep '* Version:' < jetpack-boost.php | sed 's/[^V]*Version:[^0-9]*\([^\n]*\)/\1/')


echo -n "  Removing existing 'vendor' directory." && rm -rf "./vendor" && echo -e "\\r${CHECK_MARK} Successfully removed the 'vendor' directory."
echo -n "  Installing Composer dependencies." && composer install --optimize-autoloader --no-interaction --prefer-dist --no-progress --no-dev -q && echo -e "\\r${CHECK_MARK} Successfully installed Composer dependencies."
echo -n "  Installing NPM dependencies." && npm install --silent --no-progress &>/dev/null && echo -e "\\r${CHECK_MARK} Successfully installed NPM dependencies."
echo -n "  Building assets." && npm run build --silent --no-progress &>/dev/null && echo -e "\\r${CHECK_MARK} Successfully built assets."

echo -n "  Copying files to '${PLUGIN_DIST_DIR}'." && rsync -rc --exclude-from="./.distignore" "./" $PLUGIN_DIST_DIR/ --delete --delete-excluded

echo -e "\\r${CHECK_MARK} Successfully copied files to '${PLUGIN_DIST_DIR}."
echo -n "  Generating the release zip file." && cd $PLUGIN_DIST_DIR && zip -q -r "../${DIST_FOLDER}/jetpack-boost.zip" * && cd .. && echo -e "\\r${CHECK_MARK} Successfully generated the release zip file."

echo -n "  Cleaning up." && rm -rf "./${PLUGIN_DIST_DIR}" && echo -e "\\r${CHECK_MARK} Successfully cleaned up. All done!"
