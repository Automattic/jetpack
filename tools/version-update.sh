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

# Normalizes a version string to desired length.
# First arg is input string, second is minimum number of points.
function normalize_version_number {
	TARGET_LENGTH="${2:-2}"
	VERSION_ARRAY=()

	# Break off dash content to append later.
	if [[ $1 =~ "-" ]]; then
		VERSION_SUFFIX=$(echo $1 | cut -d'-' -f 2)
		VERSION_RAW=$(echo $1 | cut -d'-' -f 1)
	else
		VERSION_RAW=$1
	fi

	# Iterate over version string, and append them to array.
	IFS='.' read -ra VERSION_PARTS <<< "$VERSION_RAW"
	for i in "${VERSION_PARTS[@]}"; do
		VERSION_ARRAY+=( "$i" )
	done

	# Add additional zeros until target length is reached.
	while [ "${#VERSION_ARRAY[@]}" -lt "$TARGET_LENGTH" ]; do
		VERSION_ARRAY+=( "0" )
	done

	# Join array by dots, then append suffix.
	NORMALIZED_VERSION=$(IFS=. ; echo "${VERSION_ARRAY[*]}")
	if [ $VERSION_SUFFIX ]; then
		NORMALIZED_VERSION="${NORMALIZED_VERSION}-${VERSION_SUFFIX}"
	fi
}

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
