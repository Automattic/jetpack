<?php
/**
 * Makes `jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page()` exist
 * before the menu tests run, so they can reach the modernized branch of
 * `Jetpack_Backup::add_wp_admin_submenu()` — which picks that callback only if
 * `function_exists()` says so.
 *
 * Two ways to get there, because the package has two states and the tests have
 * to pass in both.
 *
 * On a checkout that has never been built there is no generated file, so a
 * stub is declared here and `Jetpack_Backup::load_wp_build()` finds no
 * `build/build.php` to load.
 *
 * On a checkout that *has* been built — every developer's normal state after
 * `jp build packages/backup`, and the reason this file used to make the suite
 * fatal — the generated page is loaded instead of being faked. A stub cannot
 * coexist with it: `Admin_Modernization_Gating_Test` exercises
 * `maybe_load_wp_build()`, which requires `build/build.php`, whose `pages.php`
 * requires this same generated file, which declares the function unguarded.
 * Mock first, real file second, "Cannot redeclare" fatal. Loading it here
 * under the path `pages.php` will use means `require_once` treats the two as
 * one file and the second load is a no-op.
 *
 * Reaching into `build/` from a test is not lovely, but the alternative is a
 * suite that only passes on a clean checkout. `wp-build` is an external
 * binary, so the generated file is not ours to add a guard to.
 *
 * @package automattic/jetpack-backup-plugin
 */

$jetpack_backup_generated_page = dirname( __DIR__, 2 ) . '/build/pages/jetpack-backup-dashboard/page-wp-admin.php';

if ( file_exists( $jetpack_backup_generated_page ) ) {
	require_once $jetpack_backup_generated_page;
} elseif ( ! function_exists( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page' ) ) {
	function jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page() {}
}

unset( $jetpack_backup_generated_page );
