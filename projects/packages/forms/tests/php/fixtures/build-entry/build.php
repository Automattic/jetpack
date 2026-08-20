<?php
/**
 * Test fixture: stand-in for the entry point the WP build script generates.
 *
 * The real `build/` is gitignored and CI runs no build step, so without this there
 * is no way to exercise the "build is present" half of add_admin_submenu(). Point
 * Dashboard::$wp_build_index here to stand in for build/build.php.
 *
 * Declares the page render callback in the global namespace, because that is where
 * the real build puts it and where add_admin_submenu() looks. That half needs
 * covering precisely because the name is derived from the page slug at build time:
 * a rename on either side silently swaps the dashboard for the missing-assets
 * notice, with nothing else to signal it.
 *
 * @package automattic/jetpack-forms
 */

if ( ! function_exists( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page' ) ) {
	/**
	 * Stand-in for the generated render callback.
	 */
	function jetpack_forms_jetpack_forms_responses_wp_admin_render_page() {}
}
