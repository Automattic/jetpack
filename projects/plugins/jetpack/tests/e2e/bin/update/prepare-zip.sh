#!/bin/bash

set -e

# This script creates a Jetpack plugin zip file that can be used in the update flow
# =================================================================================

BASE_PATH=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" || return
	pwd -P
)
ZIP_FILE="$BASE_PATH/../../jetpack.zip"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
	# assuming Debian
	which zip || sudo apt-get update && sudo apt-get install -qy zip
fi

printf "\nPreparing zip file\n"
cd "$BASE_PATH/../../../../.."
find -L jetpack ! -path '**/node_modules/*' ! -path '**/\.cache/*' ! -path '**/tests/*' ! -path '**/changelog/*' ! -path '**/wordpress/*' ! -path '**/\.idea/*' -print | zip -q "$ZIP_FILE" -@
printf "\nZip file created: %s\n" "$ZIP_FILE"

printf "\nCopying zip file to docker container\n"
pnpx jetpack docker --type e2e --name t1 -v exec-silent mkdir -- -p /var/www/html/wp-content/uploads
pnpx jetpack docker --type e2e --name t1 exec-silent ls /var/www/html/wp-content/uploads
docker cp "$ZIP_FILE" jetpack_t1-wordpress-1:/var/www/html/wp-content/uploads/jetpack-next.zip
