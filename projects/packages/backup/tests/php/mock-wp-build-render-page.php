<?php
/**
 * Stand-in for the render callback the wp-build dashboard generates. `build/build.php`
 * is never generated in a unit test run, so the menu tests could not otherwise reach
 * the modernized branch of `Jetpack_Backup::add_wp_admin_submenu()`.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! function_exists( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page' ) ) {
	function jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page() {}
}
