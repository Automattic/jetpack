#!/bin/bash

# This script updates the base composer.json in Jetpack to point to the latest version of each package.
# Probably will be most useful in the release scripts that branch off, since we:
# a. Want to ship Jetpack with specific versions of packages
# b. Want to preserve @dev in master branch
#
# I was getting rate limited by the GH API when testing, so if this happens to you, you'll have to
# pass in a personal access token from GitHub to get more requests.
# Example: `bin/get-latest-package.sh -t YOUR_GH_ACCESS_TOKEN`
while getopts ":t:" opt; do
	case ${opt} in
		t ) GH_TOKEN=$OPTARG
		    AUTH_HEADER="-H 'Authorization: token $GH_TOKEN'"
			;;
		? )
			echo "Invalid argument: $OPTARG"
			echo ""
			;;
		: )
			AUTH_HEADER=""
			;;
	esac
done
shift "$(($OPTIND -1))"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
JETPACK_ROOT="$(dirname "$DIR")"
PACKAGE_NAMES=$( ls -d $JETPACK_ROOT/packages/*/ )

for PACKAGE_NAME in $PACKAGE_NAMES; do
    NAME=$( basename $PACKAGE_NAME )
    GH_TAGS_URL="https://api.github.com/repos/automattic/jetpack-$NAME/tags"
    LATEST_TAG=$( curl -s $AUTH_HEADER $GH_TAGS_URL 2>&1 | grep -m1 -o '"name":.*' | cut -d ":" -f2 | sed 's/"//g; s/v//g; s/,//g' )
    echo "Updating jetpack-$NAME to $LATEST_TAG in composer.json..."

    composer require --no-update "automattic/jetpack-$NAME:$LATEST_TAG"
done
