<?php
/**
 * Test fixture: stand-in for the generated wp-build entry point.
 *
 * Records that it was loaded so tests can assert whether Analytics::init()
 * reached the build on a given request type. The real build/ is gitignored and
 * CI runs no build step, so without this there is nothing to observe.
 *
 * Also provides the generated render callback and full-page interceptor. Their
 * names depend on the page slug, so both behaviors need test coverage.
 *
 * @package automattic/jetpack-premium-analytics
 */

$GLOBALS['jpa_test_build_loaded'] = true;

if ( ! function_exists( 'jpa_jetpack_premium_analytics_wp_admin_render_page' ) ) {
	/**
	 * Stand-in for the wp-build generated render callback.
	 */
	function jpa_jetpack_premium_analytics_wp_admin_render_page() {}
}

if ( ! function_exists( 'jpa_jetpack_premium_analytics_intercept_render' ) ) {
	/**
	 * Stand-in for the wp-build generated full-page interceptor.
	 */
	function jpa_jetpack_premium_analytics_intercept_render() {}
}

add_action( 'admin_init', 'jpa_jetpack_premium_analytics_intercept_render' );
