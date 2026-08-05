<?php
/**
 * Test fixture: stand-in for the generated wp-build entry point.
 *
 * Records that it was loaded so tests can assert whether Analytics::init()
 * reached the build on a given request type. The real build/ is gitignored and
 * CI runs no build step, so without this there is nothing to observe.
 *
 * Also declares the page render callback the real build generates, so the
 * "build is present" half of register_admin_menu() has something to find. The
 * name is derived from the page slug by wp-build, which is exactly why it needs
 * covering: a slug rename silently drops the menu back to the missing-build
 * notice.
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
