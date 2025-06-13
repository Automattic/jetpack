#!/bin/bash

## Environment used by this script:
#
# Required:
# - WP_BRANCH: Version of WordPress to check out.
#
# Other:
# - GITHUB_ENV: File written to to set environment variables for later steps.

set -eo pipefail

case "$WP_BRANCH" in
	trunk)
		WORDPRESS_TAG=trunk
		;;
	latest)
		WORDPRESS_TAG=$(php ./tools/get-wp-version.php)
		;;
	previous)
		# We hard-code the version here because there's a time near WP releases where
		# we've dropped the old 'previous' but WP hasn't actually released the new 'latest'
		WORDPRESS_TAG=6.7
		;;
	*)
		echo "Unrecognized value for WP_BRANCH: $WP_BRANCH" >&2
		exit 1
		;;
esac

if [[ -n "$GITHUB_ENV" ]]; then
	echo "WORDPRESS_TAG=$WORDPRESS_TAG" >> "$GITHUB_ENV"
fi
