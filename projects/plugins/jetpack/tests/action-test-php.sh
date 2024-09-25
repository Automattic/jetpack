#!/bin/bash

set -eo pipefail

# Conditionally allow WooCommerce/Jetpack integration tests to run.
if [[ "$WITH_WOOCOMMERCE" == true ]]; then
	export JETPACK_TEST_WOOCOMMERCE=1
	echo "::group::Jetpack WooCommerce tests"
	phpunit --group=woocommerce
	echo "::endgroup::"
	exit 0
fi

if [[ "$WITH_WPCOMSH" == true ]]; then
	export JETPACK_TEST_WPCOMSH=1
fi

echo "::group::Jetpack tests"
phpunit
echo "::endgroup::"

if [[ "$WP_BRANCH" == "trunk" ]]; then
	echo "::group::Jetpack multisite tests"
	WP_MULTISITE=1 phpunit -c tests/php.multisite.xml
	echo "::endgroup::"
fi
