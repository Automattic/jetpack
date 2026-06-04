<?php
/**
 * Test fixture: defines the wp-build chassis render function in the GLOBAL namespace
 * so Social_Admin_Page::is_wp_build_dashboard_active() detects a "loaded" chassis.
 *
 * @package automattic/jetpack-publicize
 */

if ( ! function_exists( 'jetpack_social_jetpack_social_dashboard_wp_admin_render_page' ) ) {
	/**
	 * Stand-in for the auto-generated wp-build render function.
	 *
	 * @return void
	 */
	function jetpack_social_jetpack_social_dashboard_wp_admin_render_page() {}
}
