#!/bin/bash

# This script updates the composer.json file.
# It will update any packages prefixed with `automattic/jetpack-` to it's latest stable version.

# This script should be called from a release workflow, since we:
# a. Want to ship Jetpack Boost with specific versions of Jetpack packages
# b. Want to preserve dev-master in main branch


CURRENT_DIR=$( pwd )
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Bail if no composer.json to check for.
if [[ ! -f "$ROOT_DIR/composer.json" ]]; then
    echo "EXITING: The composer.json file could not be found."
    exit;
fi

# Get the list of package names to update.
# Works in accordance of `composer show`, and will only act on packages prefixed with `automattic/jetpack-`.
# Using --self because it is agnostic to whether /vendor is populated.
composer show --self |
    while read -r LINE
    do
        # Only looks for packages labeled dev-master
        if [[ $LINE == "automattic/jetpack-"*"dev-master" ]]; then
            PACKAGE=$( echo $LINE | cut -d " " -f1 )
            LATEST_VERSION=$(composer show -a "$PACKAGE" | grep 'versions' | tr ", " "\n" | grep -E '^v[0-9]' | head -n 1 | cut -c 2-)
            echo "Updating $PACKAGE in composer.json to version $LATEST_VERSION"
            composer require $PACKAGE:$LATEST_VERSION --no-update
        fi
    done
