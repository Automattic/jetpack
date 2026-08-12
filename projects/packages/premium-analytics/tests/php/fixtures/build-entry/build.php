<?php
/**
 * Test fixture: stand-in for the generated wp-build entry point.
 *
 * Records that it was loaded so tests can assert whether Analytics::init()
 * reached the build on a given request type. The real build/ is gitignored and
 * CI runs no build step, so without this there is nothing to observe.
 *
 * Also declares the page render callback the real build generates, so the
 * "build is present" half of register_admin_menu() has something to find, and
 * hooks the full-page interceptor the way the generated page.php does, so
 * remove_full_page_interceptor() has something to unhook. Both names are derived
 * from the page slug by wp-build, which is exactly why they need covering: a slug
 * rename silently drops the menu back to the missing-build notice, and silently
 * re-exposes the ungated full-page URL.
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
