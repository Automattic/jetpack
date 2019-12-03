#!/bin/bash

# This script updates the composer.json file in of whatever directory it is run.
# It will update any packages prefixed with `automattic/jetpack-`
#
# Probably will be most useful in the release scripts that branch off, since we:
# a. Want to ship Jetpack with specific versions of packages
# b. Want to preserve @dev in master branch
#
# I was getting rate limited by the GH API when testing, so if this happens to you, you'll have to
# pass in a personal access token from GitHub to get more requests.
# Example: `bin/get-latest-package.sh -t YOUR_GH_ACCESS_TOKEN`

function usage {
	echo "usage: $0 [--update | -u]"
	echo "  -u | --update      Updates composer.lock and packages. If omitted, will only update composer.json."
	echo "  -h | --help        Help!"
	exit 1
}

UPDATE="--no-update"

for i in "$@"; do
	case $i in
		-u | --update )
		    UPDATE=""
			shift
			;;
		-h | --help )
		    usage
			exit
			;;
		* )
		    usage
			exit 1
	esac
done

CURRENT_DIR=$( pwd )
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
JETPACK_ROOT="$(dirname "$SCRIPT_DIR")"

# Bail if no composer.json to check for.
if [[ ! -f "$CURRENT_DIR/composer.json" ]]; then
    echo "EXITING: This script must be run from a directory with composer.json at it's root."
    exit;
fi

# Get the list of package names to update.
# Works in accordance of `composer show`, and will only act on packages prefixed with `automattic/jetpack-`.
# Using --self because it is agnostic to whether /vendor is populated.
composer show --self |
    while read -r LINE
    do
        # Only looks for packages labeled @dev
        if [[ $LINE == "automattic/jetpack-"*"@dev" ]]; then
            PACKAGE=$( echo $LINE | cut -d " " -f1 )
            echo "Updating $PACKAGE in $CURRENT_DIR/composer.json..."
            composer require "$PACKAGE" "$UPDATE"
        fi
    done
