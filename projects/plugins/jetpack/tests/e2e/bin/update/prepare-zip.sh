#!/bin/bash

set -e

# This script creates a Jetpack plugin zip file that can be used in the update flow
# =================================================================================

BASE_PATH=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" || return
	pwd -P
)

TMP_DIR="$BASE_PATH/../../tmp"
ZIP_FILE="$TMP_DIR/jetpack-next.zip"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
	# assuming Debian
	if [[ -z $(which zip) ]]; then sudo apt-get update && sudo apt-get install -qy zip; fi
fi

printf "\nPreparing zip file\n"
mkdir -p "$TMP_DIR"
cd "$BASE_PATH/../../../../.."
find -L jetpack ! -path '**/node_modules/*' ! -path '**/\.cache/*' ! -path '**/tests/*' ! -path '**/changelog/*' ! -path '**/wordpress/*' ! -path '**/\.idea/*' -print | zip -q "$ZIP_FILE" -@
printf "\nZip file created: %s\n" "$ZIP_FILE"

printf "\nCopying zip file to docker container\n"
pnpm jetpack docker --type e2e --name t1 exec-silent mkdir -- -p /var/www/html/wp-content/uploads

# Get container's ID. Cannot use hardcoded container name because it's different in MacOs vs Linux: https://github.com/docker/for-mac/issues/6035
CONTAINER_ID=$(docker ps -f "name=jetpack_t1" -f "ancestor=automattic/jetpack-wordpress-dev" --format "{{.ID}}")
docker cp "$ZIP_FILE" "$CONTAINER_ID":/var/www/html/wp-content/uploads/jetpack-next.zip
pnpm jetpack docker --type e2e --name t1 exec-silent ls /var/www/html/wp-content/uploads
