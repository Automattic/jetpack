#!/bin/bash

set -eo pipefail

PLUGINDIR="$PWD"

cd "$MONOREPO_BASE/projects/plugins/jetpack"

echo "::group::Jetpack Admimnpage coverage"
pnpm run test-client --coverage --collectCoverageFrom='_inc/client/state/**/*.js' --coverageDirectory="$COVERAGE_DIR/client" --coverageReporters=clover
pnpm run test-gui --coverage --collectCoverageFrom='_inc/client/**/*.js' --coverageDirectory="$COVERAGE_DIR/gui" --coverageReporters=clover
echo "::endgroup::"

echo "::group::Jetpack Extensions coverage"
pnpm run test-extensions --coverage --collectCoverageFrom='extensions/**/*.js' --coverageDirectory="$COVERAGE_DIR/extensions" --coverageReporters=clover
echo "::endgroup::"

cd "$PLUGINDIR"

echo "::group::Jetpack Backend coverage"
php -dpcov.directory=. "$(command -v phpunit)" --coverage-clover "$COVERAGE_DIR/backend/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Legacy full sync coverage"
LEGACY_FULL_SYNC=1 php -dpcov.directory=. "$(command -v phpunit)" --group=legacy-full-sync --coverage-clover "$COVERAGE_DIR/legacy-sync/clover.xml"
echo "::endgroup::"

echo "::group::Jetpack Multisite coverage"
WP_MULTISITE=1 php -dpcov.directory=. "$(command -v phpunit)" -c tests/php.multisite.xml --coverage-clover "$COVERAGE_DIR/multisite/clover.xml"
echo "::endgroup::"
