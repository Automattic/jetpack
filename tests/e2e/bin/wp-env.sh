#!/bin/bash

# Exit if any command fails.
set -e
# yarn wp-env run cli wp config set WP_HOME '"http://".\$_SERVER["HTTP_HOST"]'
# yarn wp-env run cli wp config set WP_SITEURL '"http://".\$_SERVER["HTTP_HOST"]'


. "$(dirname "$0")/includes.sh"

check_for_ngrok
check_for_jq
start_ngrok

URL=$(get_ngrok_url)

yarn wp-env start

yarn wp-env run tests-cli wp option set siteurl "$URL"
yarn wp-env run tests-cli wp option set home "$URL"
