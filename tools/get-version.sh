#!/bin/bash

# Retrieving the version from jetpack.php file
PHP_VERSION=`head -15 jetpack.php | grep '* Version' | cut -d ':' -f2`

# Getting a github prefix
CLOSEST_TAG=`git describe --tags --abbrev=0`

# Getting a git full version with the prefix and stripping away the prefix
GIT_SUFFIX=$(git describe --tags | awk -F "$CLOSEST_TAG" '{ print $2; }')

echo $PHP_VERSION$GIT_SUFFIX
