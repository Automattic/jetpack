#!/bin/bash

# Exit if any command fails.
set -e

. "$(dirname "$0")/includes.sh"

yarn wp-env start

check_for_ngrok
check_for_jq
start_ngrok

URL=$(get_ngrok_url)

yarn wp-env run tests-wordpress touch wp-content/debug.log

yarn wp-env run tests-cli wp option set siteurl "$URL"
yarn wp-env run tests-cli wp option set home "$URL"

if [ -n $LATEST_GUTENBERG ]; then
	yarn wp-env run tests-cli wp plugin install gutenberg --activate
fi
