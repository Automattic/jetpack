#!/bin/bash
set -e

command -v zip >/dev/null 2>&1 || {
	echo >&2 "The required 'zip' command is not found on your system. Aborting."
	exit 1
}

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT_DIR=$(dirname "$SCRIPT_DIR")

DIST_FOLDER="release"
TMP_BUILD_DIR="jetpack-inspect"
GIT_BRANCH=${1:-trunk}

cd $REPO_ROOT_DIR

CHECK_MARK="\033[0;32m\xE2\x9C\x94\033[0m"

# Clean up any previous build files
echo -n "  Cleaning the '${DIST_FOLDER}' directory."
rm -rf "./${DIST_FOLDER}" "./${TMP_BUILD_DIR}" && mkdir "./${DIST_FOLDER}" "./${TMP_BUILD_DIR}" && echo -e "\\r${CHECK_MARK} Successfully cleaned up the '${DIST_FOLDER}' directory."

# Build Dependencies
echo -n "  Installing Composer dependencies."
composer install --optimize-autoloader --no-interaction --prefer-dist --no-progress --no-dev -q
echo -e "\\r${CHECK_MARK} Successfully installed Composer dependencies."

echo -n "  Installing NPM dependencies."
npm install --silent --no-progress &>/dev/null && echo -e "\\r${CHECK_MARK} Successfully installed NPM dependencies."
echo -n "  Building assets." && npm run build --silent --no-progress &>/dev/null && echo -e "\\r${CHECK_MARK} Successfully built assets."

# Copy the plugin files to the dist folder
echo -n "  Copying files to '${TMP_BUILD_DIR}'." && rsync -rc --exclude-from="./.distignore" "./" $TMP_BUILD_DIR/ --delete --delete-excluded

echo -e "\\r${CHECK_MARK} Successfully copied files to '${TMP_BUILD_DIR}."
echo -n "  Generating the release zip file." && cd $TMP_BUILD_DIR && zip -q -r "../${DIST_FOLDER}/jetpack-inspect.zip" * && cd .. && echo -e "\\r${CHECK_MARK} Successfully generated the release zip file."

echo -n "  Cleaning up." && rm -rf "./${TMP_BUILD_DIR}" && echo -e "\\r${CHECK_MARK} Successfully cleaned up. All done!"
