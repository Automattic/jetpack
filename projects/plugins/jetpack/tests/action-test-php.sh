#!/usr/bin/env bash

set -eo pipefail

# Conditionally allow WooCommerce/Jetpack integration tests to run.
if [[ "$WITH_WOOCOMMERCE" == true ]]; then
	export JETPACK_TEST_WOOCOMMERCE=1
	phpunit-select-config 'phpunit.#.xml.dist' --group=woocommerce
	exit 0
fi

if [[ "$WITH_WPCOMSH" == true ]]; then
	export JETPACK_TEST_WPCOMSH=1
fi

SPLIT_ISOLATED=true

declare -A TESTS
TESTS[normal]="phpunit-select-config 'phpunit.#.xml.dist'"

# Each separate-process test re-bootstraps WordPress, so run them alongside the rest instead of after.
if [[ "$SPLIT_ISOLATED" == true ]]; then
	JETPACK_ISOLATED_FILTER="$( php tests/isolated-tests-filter.php )"
	JETPACK_NOT_ISOLATED_FILTER="$( php tests/isolated-tests-filter.php --exclude )"
	export JETPACK_ISOLATED_FILTER JETPACK_NOT_ISOLATED_FILTER
	TESTS[normal]="phpunit-select-config 'phpunit.#.xml.dist' --filter \"\$JETPACK_NOT_ISOLATED_FILTER\""
	TESTS[isolated]="phpunit-select-config 'phpunit.#.xml.dist' --filter \"\$JETPACK_ISOLATED_FILTER\""
fi

if [[ "$WP_BRANCH" == "trunk" ]]; then
	TESTS[multisite]="WP_MULTISITE=1 phpunit-select-config 'tests/php.multisite.#.xml'"
fi

if [[ "$WP_BRANCH" == "latest" && "$PHP_VERSION" == "7.4" ]]; then
	TESTS[lfs]="LEGACY_FULL_SYNC=1 phpunit-select-config 'phpunit.#.xml.dist' --group=legacy-full-sync"
fi

if [[ ${#TESTS[@]} -eq 1 ]]; then
	# Note `eval` would be unsafe if the above contained user input, but they don't so we're good.
	# (then again, passing strings to `concurrently` would too)
	eval "${TESTS[*]}"
else
	export PHPUNIT_JETPACK_TESTSUITE_IS_PARALLEL=true

	# To run the PHP tests in parallel, we need to create custom configs for each.
	for test in "${!TESTS[@]}"; do
		P="${WP_TESTS_CONFIG_FILE_PATH%.php}.$test.php"
		cp "$WP_TESTS_CONFIG_FILE_PATH" "$P"
		sed -i "s!wptests_jetpack!wptests_jetpack_$test!" "$P"
		mysql -e "DROP DATABASE IF EXISTS wptests_jetpack_$test;"
		mysql -e "CREATE DATABASE wptests_jetpack_$test;"
		TESTS[$test]="WP_TESTS_CONFIG_FILE_PATH=\"$P\" ${TESTS[$test]}"
	done

	pnpm exec concurrently --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
fi
