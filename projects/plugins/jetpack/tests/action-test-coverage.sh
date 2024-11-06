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
TESTS[php-normal]="php -dpcov.directory=. \"$(command -v phpunit)\" --coverage-php \"$COVERAGE_DIR/backend/php.cov\""
TESTS[php-lfs]="WP_TESTS_CONFIG_FILE_PATH=\"${WP_TESTS_CONFIG_FILE_PATH%.php}.lfs.php\" LEGACY_FULL_SYNC=1 php -dpcov.directory=. \"$(command -v phpunit)\" --group=legacy-full-sync --coverage-php \"$COVERAGE_DIR/legacy-sync/php.cov\""
TESTS[php-multisite]="WP_TESTS_CONFIG_FILE_PATH=\"${WP_TESTS_CONFIG_FILE_PATH%.php}.multi.php\" WP_MULTISITE=1 php -dpcov.directory=. \"$(command -v phpunit)\" -c tests/php.multisite.xml --coverage-php \"$COVERAGE_DIR/multisite/php.cov\""
TESTS[client]="pnpm run test-client --coverage"
TESTS[gui]="pnpm run test-gui --coverage"
TESTS[extensions]="pnpm run test-extensions --coverage"

pnpm exec concurrently --kill-others-on-fail --max-processes '100%' --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
