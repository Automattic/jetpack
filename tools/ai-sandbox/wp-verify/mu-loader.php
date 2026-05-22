<?php
/**
 * Must-use plugin: bootstraps premium-analytics standalone in the wp-verify environment.
 *
 * The package has no runtime composer dependencies (only php >= 7.2), so we load
 * the entry file directly via require_once (no classmap or composer autoloader needed).
 *
 * @package automattic/jetpack-premium-analytics
 */

defined( 'ABSPATH' ) || exit; // Prevent direct web access.

// @phan-suppress-next-line PhanUndeclaredConstant -- WP_CONTENT_DIR is defined by WordPress at runtime.
$entry = WP_CONTENT_DIR . '/plugins/premium-analytics/src/class-analytics.php';
if ( ! file_exists( $entry ) ) {
	// Log the full path server-side only; don't expose filesystem layout in the browser.
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- test environment only.
	error_log( 'premium-analytics mu-loader: entry point not found: ' . $entry );
	wp_die( 'premium-analytics plugin failed to load. Check the server error log.' );
}
require_once $entry;

add_action(
	'plugins_loaded',
	function () {
		if ( class_exists( 'Automattic\\Jetpack\\PremiumAnalytics\\Analytics' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- class existence verified by class_exists() above.
			\Automattic\Jetpack\PremiumAnalytics\Analytics::init();
		}
	},
	1
);
