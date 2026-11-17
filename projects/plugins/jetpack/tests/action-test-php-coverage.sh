#!/usr/bin/env bash

set -eo pipefail

export PHPUNIT_JETPACK_TESTSUITE_IS_PARALLEL=true

declare -A TESTS
TESTS[normal]="php -dpcov.directory=. \"$(command -v phpunit-select-config)\" phpunit.#.xml.dist --coverage-php \"$COVERAGE_DIR/backend/php.cov\""
TESTS[lfs]="LEGACY_FULL_SYNC=1 php -dpcov.directory=. \"$(command -v phpunit-select-config)\" phpunit.#.xml.dist --group=legacy-full-sync --coverage-php \"$COVERAGE_DIR/legacy-sync/php.cov\""
TESTS[multisite]="WP_MULTISITE=1 php -dpcov.directory=. \"$(command -v phpunit-select-config)\" tests/php.multisite.#.xml --coverage-php \"$COVERAGE_DIR/multisite/php.cov\""

# Isolate each parallel run the same way action-test-php.sh does.
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
