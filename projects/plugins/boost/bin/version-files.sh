#!/bin/bash

# This script updates the following files:
# jetpack-boost.php
# package.json
# composer.json
# readme.txt

# It modifies version number strings to match the new version being created.

CURRENT_DIR=$( pwd )
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_VERSION=${1}

cat jetpack-boost.php | sed -E "s/(\* Version:[[:space:]]+).+$/\1${TARGET_VERSION}/g" > jetpack-boost.php.new
mv jetpack-boost.php.new jetpack-boost.php

# also change the constant we define
# define( 'JETPACK_BOOST_VERSION', '1.0-beta1' );
cat jetpack-boost.php | sed -E "s/('JETPACK_BOOST_VERSION', ).+$/\1'${TARGET_VERSION}' );/g" > jetpack-boost.php.new
mv jetpack-boost.php.new jetpack-boost.php

cat package.json | sed -E "s/^([[:space:]]\"version\": ).+$/\1\"${TARGET_VERSION}\",/g" > package.json.new
mv package.json.new package.json

cat composer.json | sed -E "s/^([[:space:]]\"version\": ).+$/\1\"${TARGET_VERSION}\",/g" > composer.json.new
mv composer.json.new composer.json

cat readme.txt | sed -E "s/^(Stable tag: ).+$/\1${TARGET_VERSION}/g" > readme.txt.new
mv readme.txt.new readme.txt