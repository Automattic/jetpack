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

declare -A TESTS
TESTS[normal]="phpunit-select-config 'phpunit.#.xml.dist'"

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

	# Parallel runs each need their own config, database and WordPress directory: core writes
	# files such as `.maintenance` into the latter, which breaks a run that boots while they exist.
	for test in "${!TESTS[@]}"; do
		WP_DIR="$WORDPRESS_DEVELOP_DIR-$test"
		cp -al "$WORDPRESS_DEVELOP_DIR" "$WP_DIR"
		# The config defines ABSPATH relative to itself, so it has to live in the copy.
		P="$WP_DIR/$(basename "${WP_TESTS_CONFIG_FILE_PATH%.php}").$test.php"
		cp "$WP_TESTS_CONFIG_FILE_PATH" "$P"
		sed -i "s!wptests_jetpack!wptests_jetpack_$test!" "$P"
		mysql -e "DROP DATABASE IF EXISTS wptests_jetpack_$test;"
		mysql -e "CREATE DATABASE wptests_jetpack_$test;"
		TESTS[$test]="WORDPRESS_DEVELOP_DIR=\"$WP_DIR\" WORDPRESS_DIR=\"$WP_DIR/src\" WP_TESTS_CONFIG_FILE_PATH=\"$P\" ${TESTS[$test]}"
	done

	pnpm exec concurrently --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
fi
