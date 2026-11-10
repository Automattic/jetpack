#!/usr/bin/env bash
# Sourced by action-test-php.sh and action-test-php-coverage.sh. Run from the plugin directory.

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
			echo "::error::Every testsuite in $CONFIG must be in exactly one shard in tests/phpunit-shards.sh (< unassigned, > unknown or duplicated)."
			exit 1
		fi
	done
}
check_shards 'phpunit.*.xml.dist' "${SHARDS[*]}"
check_shards 'tests/php.multisite.*.xml' "${MULTISITE_SHARDS[*]}"

# shard_suites <shard list>: the --testsuite argument for a shard.
shard_suites() {
	xargs <<<"$1" | tr ' ' ,
}
