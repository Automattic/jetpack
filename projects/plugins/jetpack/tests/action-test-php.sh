#!/bin/bash

set -eo pipefail

echo "::group::Jetpack tests"
phpunit
echo "::endgroup::"

if [[ "$WP_BRANCH" == "trunk" ]]; then
	echo "::group::Jetpack multisite tests"
	WP_MULTISITE=1 phpunit -c tests/php.multisite.xml
	echo "::endgroup::"
fi

if [[ "$WP_BRANCH" == "latest" && "$PHP_VERSION" == "7.0" ]]; then
	echo "::group::Jetpack Legacy Full Sync tests"
	LEGACY_FULL_SYNC=1 phpunit --group=legacy-full-sync
	echo "::endgroup::"
fi
