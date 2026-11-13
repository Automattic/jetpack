#!/usr/bin/env bash

set -eo pipefail

export PHPUNIT_JETPACK_TESTSUITE_IS_PARALLEL=true

source tests/phpunit-shards.sh

PHPUNIT="php -dpcov.directory=. \"$(command -v phpunit-select-config)\""

declare -A TESTS
for shard in "${!SHARDS[@]}"; do
	TESTS[$shard]="$PHPUNIT phpunit.#.xml.dist --testsuite '$( shard_suites "${SHARDS[$shard]}" )' --coverage-php \"$COVERAGE_DIR/$shard/php.cov\""
done
for shard in "${!MULTISITE_SHARDS[@]}"; do
	TESTS[$shard]="WP_MULTISITE=1 $PHPUNIT tests/php.multisite.#.xml --testsuite '$( shard_suites "${MULTISITE_SHARDS[$shard]}" )' --coverage-php \"$COVERAGE_DIR/$shard/php.cov\""
done
TESTS[lfs]="LEGACY_FULL_SYNC=1 $PHPUNIT phpunit.#.xml.dist --group=legacy-full-sync --coverage-php \"$COVERAGE_DIR/lfs/php.cov\""

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
