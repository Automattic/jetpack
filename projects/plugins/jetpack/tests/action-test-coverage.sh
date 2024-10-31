#!/bin/bash

set -eo pipefail

declare -A TESTS
TESTS=()
# Can't run PHP tests in parallel, it runs into DB deadlocks.
TESTS[php]="
	php -dpcov.directory=. \"$(command -v phpunit)\" --coverage-clover \"$COVERAGE_DIR/backend/clover.xml\" &&
	LEGACY_FULL_SYNC=1 php -dpcov.directory=. \"$(command -v phpunit)\" --group=legacy-full-sync --coverage-clover \"$COVERAGE_DIR/legacy-sync/clover.xml\" &&
	WP_MULTISITE=1 php -dpcov.directory=. \"$(command -v phpunit)\" -c tests/php.multisite.xml --coverage-clover \"$COVERAGE_DIR/multisite/clover.xml\"
"
TESTS[client]="pnpm run test-client --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"
TESTS[gui]="pnpm run test-gui --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"
TESTS[extensions]="pnpm run test-extensions --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory=\"$COVERAGE_DIR/client\" --coverageReporters=clover"

pnpm exec concurrently --kill-others-on-fail --max-processes '100%' --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
