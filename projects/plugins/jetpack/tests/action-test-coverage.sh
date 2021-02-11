#!/bin/bash

set -eo pipefail

echo "::group::Jetpack yarn install"
yarn install
echo "::endgroup::"

echo "::group::Jetpack Admimnpage coverage"
yarn nyc --reporter=clover -x '_inc/**/**/test/*.js' --report-dir="$COVERAGE_DIR/adminpage" yarn test-adminpage
echo "::endgroup::"

echo "::group::Jetpack Extensions coverage"
yarn test-extensions --coverage --collectCoverageFrom='extensions/**/*.js' --coverageDirectory="$COVERAGE_DIR/extensions" --coverageReporters=clover
echo "::endgroup::"

echo "::group::Jetpack Backend coverage"
phpdbg -qrr "$(which phpunit)" --coverage-clover "$COVERAGE_DIR/backend/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Legacy full sync coverage"
LEGACY_FULL_SYNC=1 phpdbg -qrr "$(which phpunit)" --group=legacy-full-sync --coverage-clover "$COVERAGE_DIR/legacy-sync/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Multisite coverage"
WP_MULTISITE=1 phpdbg -qrr "$(which phpunit)" -c tests/php.multisite.xml --coverage-clover "$COVERAGE_DIR/multisite/clover.xml"
echo "::endgroup::"
