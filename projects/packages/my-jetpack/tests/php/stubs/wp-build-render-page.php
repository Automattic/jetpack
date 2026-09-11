<?php
/**
 * Test stub for the wp-build render function.
 *
 * The real one lives in the generated build/pages/ tree, which an unbuilt checkout
 * (CI) does not have. Declared here at global scope, because that is where
 * enqueue_scripts() looks for it.
 *
 * @package my-jetpack
 */

if ( ! function_exists( 'jetpack_my_jetpack_my_jetpack_dashboard_wp_admin_render_page' ) ) {
	/**
	 * Stand in for the generated page renderer.
	 *
	 * @return void
	 */
	function jetpack_my_jetpack_my_jetpack_dashboard_wp_admin_render_page() {}
}
