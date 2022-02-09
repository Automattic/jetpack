#!/bin/bash

set -e

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$BASE_DIR/../../.."
TMP_DIR="$BASE_DIR/../tmp/build"
ZIP_FILE="$BASE_DIR/../tmp/jetpack.99.9.zip"

cd $PLUGIN_DIR
pwd

if [ "$SKIP_ARCHIVE" == true ]; then
	echo "Skipping archiving Jetpack build. Jetpack archive expected to exist: $ZIP_FILE"
else
	echo "Cleaning up old files"
#  rm -rf "$TMP_DIR"
#  mkdir -p "$TMP_DIR"

	echo "Copying build files to $TMP_DIR"

	echo "Creating build archive"
  zip -r "$TMP_DIR/build" "$ZIP_FILE"
fi


