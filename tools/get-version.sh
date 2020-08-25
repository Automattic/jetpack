#!/bin/bash

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/includes/normalize-version.sh"

# Retrieving the version from jetpack.php file
PHP_VERSION=$(head -15 jetpack.php | grep '* Version' | cut -d ':' -f2)

# Getting a github prefix
CLOSEST_TAG=$(git describe --tags --abbrev=0)

# Getting a git full version with the prefix and stripping away the prefix
GIT_SUFFIX=$(git describe --tags | awk -F "$CLOSEST_TAG" '{ print $2; }')

normalize_version_number "$PHP_VERSION" 3

echo $NORMALIZED_VERSION$GIT_SUFFIX
