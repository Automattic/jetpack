#!/bin/bash

# https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -euo pipefail

# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m';
GREEN_BOLD='\033[1;32m';
RED_BOLD='\033[1;31m';
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';

error () {
	printf "\n🤯 ${RED_BOLD}$1${COLOR_RESET}\n"
}
status () {
	printf "\n👩‍💻 ${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success () {
	printf "\n✅ ${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning () {
	printf "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

SCRIPT_DIR=$(dirname "$(realpath "$0")" || true)
PACKAGE_JSON="$SCRIPT_DIR/../package.json"
CURRENT_VERSION=$(grep '"version":' "$PACKAGE_JSON" | awk -F '"' '{print $4}' || true)
if [ -n "$CURRENT_VERSION" ]; then
    status "Current version is $CURRENT_VERSION"
fi

status "Update version"

echo "Enter the version number to update to, for example 1.0.0: "
read -r VERSION

status "Bump version in package.json"
npm --no-git-tag-version version $VERSION || {
    error "ERROR: Invalid version number."
    exit 1
}

status "Bump version in other files"
php bin/update-version.php || {
    error "Failed."
    exit 1
}

status "Make sure the following changes have been made, then commit them and push them to a new PR."
echo "- package.json: new version number"
echo "- wpcomsh.php: new version numbers"
echo "\n"
git status
