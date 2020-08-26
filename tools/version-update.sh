#!/bin/bash

# Instructions
function usage {
	echo "usage: $0 [-v version] [-n count] [-N]"
	echo "  -v      The version string."
	echo "  -n      Returns a normalized version number and exits."
	echo "          Specify a number for the number of decimals."
	echo "  -N      Only updates files without a commit."
	echo "  -h      help"
	exit 1
}

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/includes/normalize-version.sh"

# Sets options.
while getopts ":hv:n:N" opt; do
	case ${opt} in
		v ) VERSION_RAW=$OPTARG
			;;
		n ) VERSION_ONLY=$OPTARG
			;;
		N ) DO_COMMIT=false
			;;
		h ) usage
			;;
		: )
			if [[ $OPTARG == "n" ]]; then
				VERSION_ONLY=2
			fi
			;;
		? )
			echo "Invalid argument: $OPTARG"
			echo ""
			usage
			;;
	esac
done
shift "$(($OPTIND -1))"

# Prompt for version number if not provided.
if [[ -z $VERSION_RAW ]]; then
	read -p "What version are you releasing? Example: 4.9 - " VERSION_RAW
fi

# If we have a version request set, do that and exit.
if [[ $VERSION_ONLY ]]; then
	normalize_version_number $VERSION_RAW $VERSION_ONLY
	echo $NORMALIZED_VERSION
	exit
fi

# Build versions.
normalize_version_number $VERSION_RAW
TARGET_VERSION=$NORMALIZED_VERSION
normalize_version_number $VERSION_RAW 3
NPM_TARGET_VERSION=$NORMALIZED_VERSION

# Updates file target version.
read -n1 -p "Would you like to update the version number in files to $TARGET_VERSION? [y/N]" reply
echo ""
if [[ 'y' != $reply && 'Y' != $reply ]]; then
	echo "Okay, done!"
	exit
fi

# Replace all file contents.
sed -i.bak -E "s/Version: .+/Version: ${TARGET_VERSION}/" jetpack.php
sed -i.bak -E "s/'JETPACK__VERSION',( +)'(.+)'/'JETPACK__VERSION',\1'${TARGET_VERSION}'/" jetpack.php
sed -i.bak -E "s/\"version\": \".+\"/\"version\": \"${NPM_TARGET_VERSION}\"/" package.json
rm *.bak # We need a backup file because macOS requires it.

git --no-pager diff HEAD jetpack.php package.json
echo ""
read -n1 -p "Here is the diff. Would you like to commit this? [y/N]" reply
echo ""
if [[ 'y' != $reply && 'Y' != $reply ]]; then
	echo "Got it. Please commit manually."
	exit
fi

# Commit changed files.
git commit -m "updated version to ${TARGET_VERSION}" jetpack.php package.json
commit_status=$?
echo ""
if [ $commit_status -eq 0 ]; then
	echo "Updated version in jetpack.php and package.json."
else
	echo "Error doing commit. Please try again manually."
fi
