#!/usr/bin/env bash

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
		# We support the latest and previous WP versions, so 'previous' is also the minimum we support.
		# It's hard-coded (in versions.sh) rather than detected because there's a time near WP releases
		# where we've dropped the old 'previous' but WP hasn't actually released the new 'latest'.
		#
		# Read in a subshell: setup-wordpress-env.sh sources this script, and versions.sh would otherwise
		# clobber that script's PHP_VERSION, which tests.yml sets from the job matrix.
		# shellcheck source=../versions.sh
		WORDPRESS_TAG=$( source "$(dirname "${BASH_SOURCE[0]}")/../versions.sh" && echo "$MIN_WP_VERSION" )
		;;
	*)
		echo "Unrecognized value for WP_BRANCH: $WP_BRANCH" >&2
		exit 1
		;;
esac

if [[ -n "$GITHUB_ENV" ]]; then
	echo "WORDPRESS_TAG=$WORDPRESS_TAG" >> "$GITHUB_ENV"
fi
