#!/bin/bash

set -eo pipefail

. tests/maybe-download-phpunit.sh

PLUGINDIR="$PWD"

cd "$MONOREPO_BASE/projects/plugins/jetpack"

echo "::group::Jetpack JS install"
pnpm install
echo "::endgroup::"

echo "::group::Jetpack Admimnpage coverage"
pnpx nyc --reporter=clover -x '_inc/**/**/test/*.js' --report-dir="$COVERAGE_DIR/adminpage" pnpm run test-adminpage
echo "::endgroup::"

echo "::group::Jetpack Extensions coverage"
pnpm run test-extensions -- --coverage --collectCoverageFrom='extensions/**/*.js' --coverageDirectory="$COVERAGE_DIR/extensions" --coverageReporters=clover
echo "::endgroup::"

cd "$PLUGINDIR"

echo "::group::Jetpack Backend coverage"
phpdbg -qrr "$phpunit" --coverage-clover "$COVERAGE_DIR/backend/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Legacy full sync coverage"
LEGACY_FULL_SYNC=1 phpdbg -qrr "$phpunit" --group=legacy-full-sync --coverage-clover "$COVERAGE_DIR/legacy-sync/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Multisite coverage"
WP_MULTISITE=1 phpdbg -qrr "$phpunit" -c tests/php.multisite.xml --coverage-clover "$COVERAGE_DIR/multisite/clover.xml"
echo "::endgroup::"
