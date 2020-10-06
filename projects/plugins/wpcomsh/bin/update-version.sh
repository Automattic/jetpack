#!/bin/sh

# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m';
GREEN_BOLD='\033[1;32m';
RED_BOLD='\033[1;31m';
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';

error () {
	echo "\n🤯 ${RED_BOLD}$1${COLOR_RESET}\n"
}
status () {
	echo "\n👩‍💻 ${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success () {
	echo "\n✅ ${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning () {
	echo "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

status "Update version"

echo "Enter the version number to update to, for example 1.0.0: "
read -r VERSION

status "Bump version in package.json"
npm --no-git-tag-version version $VERSION || {
    error "ERROR: Invalid version number."
    exit 1
}

status "Bump version in other files"
php bin/update-version.php

status "Make sure the following changes have been made, then commit them and push them to a new PR."
echo "- package.json: new version number"
echo "- wpcomsh.php: new version numbers"
echo "\n"
git status
