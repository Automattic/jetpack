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

"$BASE_PATH"/prepare-zip.sh
pnpx jetpack docker --type e2e --name t1 exec /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/pre-update.sh "${1}"

printf "\nAttempting update\n"
pnpx jetpack docker --type e2e --name t1 exec wp -- --allow-root plugin update jetpack

pnpx jetpack docker --type e2e --name t1 exec /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/post-update.sh

mkdir -p "$BASE_PATH"/../../output/update
curl "${1}"/wp-content/uploads/jetpack-status-diff -o "$BASE_PATH"/../../output/update/jetpack-status-diff




