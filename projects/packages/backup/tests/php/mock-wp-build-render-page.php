<?php
/**
 * Stand-in for the render callback the wp-build dashboard generates.
 *
 * `Jetpack_Backup::add_wp_admin_submenu()` picks the wp-build callback only
 * when `build/build.php` has been generated and loaded, which never happens
 * in a unit test run. Defining the same function here lets the menu tests
 * exercise the modernized branch of that choice.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! function_exists( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page' ) ) {
	/**
	 * Render the modernized Backup dashboard page. No-op in tests.
	 *
	 * @return void
	 */
	function jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page() {}
}
