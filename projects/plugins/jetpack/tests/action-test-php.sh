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

# Testsuites split into concurrent shards of roughly equal runtime.
# Loading json-api's files fires rest_api_init, which some general, sync, and seo-discoverability tests rely on.
declare -A SHARDS
SHARDS[shard1]='sitemaps extensions autoloaded'
SHARDS[shard2]='general json-api sync legacy-full-sync uninstall seo-discoverability'
SHARDS[shard3]='
	core-api media photon google-font-face infinite-scroll theme-tools comment-likes likes
	scan markdown publicize post-by-email related-posts sharedaddy shortcodes widgets widget-visibility
	wordads subscriptions memberships verification-tools videopress lib restapi get_modules 3rd-party
	carousel copy-post deprecation seo-tools canonical-urls compatfunctions opengraph block-manifest
	jetpack-admin unauth-file-upload import seo-module-state
'

declare -A MULTISITE_SHARDS
MULTISITE_SHARDS[ms1]='general json-api sync uninstall'
MULTISITE_SHARDS[ms2]='
	core-api media photon google-font-face infinite-scroll publicize sharedaddy shortcodes widgets
	subscriptions premium-content restapi opengraph autoloaded
'

# check_shards <config glob> <shard names, space separated>
check_shards() {
	local ASSIGNED CONFIG
	ASSIGNED="$( xargs -n1 <<<"$2" | sort )"
	for CONFIG in $1; do
		if ! diff <( sed -n 's/.*<testsuite name="\([^"]*\)".*/\1/p' "$CONFIG" | sort ) - <<<"$ASSIGNED"; then
			echo "::error::Every testsuite in $CONFIG must be in exactly one shard in tests/action-test-php.sh (< unassigned, > unknown or duplicated)."
			exit 1
		fi
	done
}
check_shards 'phpunit.*.xml.dist' "${SHARDS[*]}"
check_shards 'tests/php.multisite.*.xml' "${MULTISITE_SHARDS[*]}"

declare -A TESTS
for shard in "${!SHARDS[@]}"; do
	TESTS[$shard]="phpunit-select-config 'phpunit.#.xml.dist' --testsuite '$( xargs <<<"${SHARDS[$shard]}" | tr ' ' , )'"
done

if [[ "$WP_BRANCH" == "trunk" ]]; then
	for shard in "${!MULTISITE_SHARDS[@]}"; do
		TESTS[$shard]="WP_MULTISITE=1 phpunit-select-config 'tests/php.multisite.#.xml' --testsuite '$( xargs <<<"${MULTISITE_SHARDS[$shard]}" | tr ' ' , )'"
	done
fi

if [[ "$WP_BRANCH" == "latest" && "$PHP_VERSION" == "7.4" ]]; then
	TESTS[lfs]="LEGACY_FULL_SYNC=1 phpunit-select-config 'phpunit.#.xml.dist' --group=legacy-full-sync"
fi

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

# Note passing strings to `concurrently` would be unsafe if the above contained user input, but they don't so we're good.
pnpm exec concurrently --names "$( IFS=,; echo "${!TESTS[*]}" )" "${TESTS[@]}"
