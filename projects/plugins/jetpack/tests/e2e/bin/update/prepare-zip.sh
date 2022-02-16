#!/bin/bash

set -e

# This script creates a Jetpack plugin zip file that can be used in the update flow
# =================================================================================

BASE_PATH=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" || return
	pwd -P
)

UPLOADS_DIR="$BASE_PATH/../../../../../../../tools/docker/wordpress/wp-content/uploads"
ZIP_FILE="$UPLOADS_DIR/jetpack-next.zip"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
	# assuming Debian
	which zip || sudo apt-get update && sudo apt-get install -qy zip
fi

printf "\nPreparing zip file\n"
mkdir -p "$UPLOADS_DIR"
cd "$BASE_PATH/../../../../.."
find -L jetpack ! -path '**/node_modules/*' ! -path '**/\.cache/*' ! -path '**/tests/*' ! -path '**/changelog/*' ! -path '**/wordpress/*' ! -path '**/\.idea/*' -print | zip -q "$ZIP_FILE" -@
printf "\nZip file created: %s\n" "$ZIP_FILE"
