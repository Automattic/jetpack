#!/bin/bash

set -eo pipefail

# To run the PHP tests in parallel, we need to create custom configs for each.
for test in lfs multi; do
	P="${WP_TESTS_CONFIG_FILE_PATH%.php}.$test.php"
	cp "$WP_TESTS_CONFIG_FILE_PATH" "$P"
	sed -i "s!wptests_jetpack!wptests_jetpack_$test!" "$P"
	mysql -e "DROP DATABASE IF EXISTS wptests_jetpack_$test;"
	mysql -e "CREATE DATABASE wptests_jetpack_$test;"
done

declare -A TESTS
TESTS=()
TESTS[php-normal]="php -dpcov.directory=. \"$(command -v phpunit)\" --coverage-clover \"$COVERAGE_DIR/backend/clover.xml\""
TESTS[php-lfs]="WP_TESTS_CONFIG_FILE_PATH=\"${WP_TESTS_CONFIG_FILE_PATH%.php}.lfs.php\" LEGACY_FULL_SYNC=1 php -dpcov.directory=. \"$(command -v phpunit)\" --group=legacy-full-sync --coverage-clover \"$COVERAGE_DIR/legacy-sync/clover.xml\""
TESTS[php-multisite]="WP_TESTS_CONFIG_FILE_PATH=\"${WP_TESTS_CONFIG_FILE_PATH%.php}.multi.php\" WP_MULTISITE=1 php -dpcov.directory=. \"$(command -v phpunit)\" -c tests/php.multisite.xml --coverage-clover \"$COVERAGE_DIR/multisite/clover.xml\""
TESTS[client]="pnpm run test-client --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"
TESTS[gui]="pnpm run test-gui --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"
TESTS[extensions]="pnpm run test-extensions --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"

pnpm exec concurrently --kill-others-on-fail --max-processes '100%' --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
