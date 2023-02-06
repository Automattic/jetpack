#!/bin/bash
# Exit if any command fails.
set -e

# This is a complete Jetpack plugin update flow through the CLI
# It creates a new version archive and updates the stable version to it
# =====================================================================

if [ -z "${1}" ]; then
	echo "ERROR: Missing argument site url"
	echo "usage: $0 URL"
	exit 1
fi

BASE_PATH=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" || return
	pwd -P
)

## Preparation
"$BASE_PATH"/prepare-zip.sh
pnpm jetpack docker --type e2e --name t1 exec-silent /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/prepare-update.sh "${1}"

## Update
printf "\nNow is a good time to configure Jetpack. Take your time, make some changes in the site config and come back here when ready."
printf "\n\n"

while true; do
	read -r -p "Are you ready to update? [y] " input

	case $input in
	[yY][eE][sS] | [yY])
		break
		;;
	*)
		echo "OK, so you're not ready yet... No worries, I'm patient."
		;;
	esac
done

printf "\nAttempting update\n"
pnpm jetpack docker --type e2e --name t1 exec-silent /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/pre-update.sh
pnpm jetpack docker --type e2e --name t1 exec-silent wp -- --allow-root plugin update jetpack
pnpm jetpack docker --type e2e --name t1 exec-silent /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/post-update.sh
mkdir -p "$BASE_PATH"/../../output/update
curl "${1}"/wp-content/uploads/jetpack-status-diff -o "$BASE_PATH"/../../output/update/jetpack-status-diff
