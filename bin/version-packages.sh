#!/bin/bash

# This script updates the composer.json file in of whatever directory it is run.
# It will update any packages prefixed with `automattic/jetpack-` to it's latest stable version.
#
# Probably will be most useful in the release scripts that branch off, since we:
# a. Want to ship Jetpack with specific versions of packages
# b. Want to preserve @dev in master branch

function usage {
	echo "usage: $0 [--package=example] [--no-update]"
	echo "  --no-update        If set, will only update composer.json file without updating the packages themselves."
	echo "  -p | --package     Will update a sub-package's dependencies (must be found in JETPACK_ROOT/packages/ dir)"
	echo "  -h | --help        Help!"
	exit 1
}

UPDATE=""
PACKAGE=""
for i in "$@"; do
	case $i in
		--no-update )
		    UPDATE="--no-update"
			shift
			;;
		-p=* | --package=* )
		    PACKAGE="${i#*=}"
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

# If we're only modifying a sub-package.
if [[ ! -z $PACKAGE ]]; then
    CURRENT_DIR="$JETPACK_ROOT/packages/$PACKAGE"
    cd $CURRENT_DIR
fi

# Bail if no composer.json to check for.
if [[ ! -f "$CURRENT_DIR/composer.json" ]]; then
    echo "EXITING: This script must be run from a directory with composer.json at it's root."
    exit 1;
fi

# Remove the local repo from composer.json.
composer config --unset repositories.0

# Get the list of package names to update.
# Works in accordance of `composer show`, and will only act on packages prefixed with `automattic/jetpack-`.
# Using --self because it is agnostic to whether /vendor is populated.
# --self displays all of the production requires, then "requires (dev)" followed by the dev requirements.
# If we get to the `requires (dev)` line, we can flag to install with `--dev`.
DEV='';
composer show --self |
    while read -r LINE
    do
        if [[ $LINE == "requires (dev)" ]]; then
            DEV='--dev'
        fi
        # Only looks for packages labeled @dev
        if [[ $LINE == "automattic/jetpack-"*"@dev" ]]; then
            PACKAGE=$( echo $LINE | cut -d " " -f1 )
            echo "Updating $PACKAGE in $CURRENT_DIR/composer.json..."
            composer require $DEV $PACKAGE $UPDATE
        fi
    done
