<?php
/**
 * Stands in for the Complianz functions that say whether its Jetpack integration blocks Stats, driven by `$GLOBALS['cmplz_mock']`.
 *
 * @package automattic/jetpack-premium-analytics
 */

/**
 * Whether an integration is enabled and its plugin active.
 *
 * @param string $plugin Integration slug.
 * @return bool
 */
function cmplz_integration_plugin_is_enabled( $plugin ) {
	return 'jetpack' === $plugin && ! empty( $GLOBALS['cmplz_mock']['integration'] );
}

/**
 * Whether the cookie blocker runs.
 *
 * @param bool $admin_test Whether to ignore that the request is in wp-admin.
 * @return bool
 */
function cmplz_can_run_cookie_blocker( $admin_test = false ) {
	return $admin_test && ! empty( $GLOBALS['cmplz_mock']['blocker'] );
}
