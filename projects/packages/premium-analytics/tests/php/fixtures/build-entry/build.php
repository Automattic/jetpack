<?php
/**
 * Test fixture: stand-in for the generated wp-build entry point.
 *
 * Records that it loaded so tests can tell whether Analytics::init() reached the build on a given
 * request type — build/ is gitignored and CI runs no build step, so without this there's nothing
 * to observe. Also provides the render callback and full-page interceptor, whose names depend on the page slug.
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

// Record the priority it went on at. Without this the removal test cannot tell
// "hooked, then removed" from "never hooked", and would pass either way.
$GLOBALS['jpa_test_interceptor_priority'] = has_action( 'admin_init', 'jpa_jetpack_premium_analytics_intercept_render' );
