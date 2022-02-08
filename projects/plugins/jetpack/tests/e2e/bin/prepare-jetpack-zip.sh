#!/bin/bash

set -e

BASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$BASE_DIR/../tmp"
ZIP_FILE="$BASE_DIR/../tmp/jetpack.99.9.zip"

# Clean-up old files
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

if [ "$SKIP_BUILD" == true ]; then
	echo "Skipping Jetpack build. Jetpack archive expected to exist: $ZIP_FILE"
else
	echo "Building production Jetpack"
  pnpx jetpack build --no-pnpm-install --for-mirrors="$TMP_DIR" --production plugins/jetpack
fi

echo "Creating build archive"
zip -r "$TMP_DIR/build/Automattic/jetpack-production" "$ZIP_FILE"
