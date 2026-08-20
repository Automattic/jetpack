<?php
/**
 * Stand-in for the wp-build dashboard's generated render function.
 *
 * The real function is generated into the gitignored `build/`, so it never
 * exists during a test run. `Jetpack_Backup::is_wp_build_dashboard_active()`
 * probes it with `function_exists()`, and the only way to exercise the
 * build-present branch is to declare it.
 *
 * Guarded because another test file may declare the same function; whichever
 * loads first wins and the other is a no-op.
 *
 * Deliberately global-namespaced: the production check passes a literal,
 * unqualified name to `function_exists()`.
 *
 * @package automattic/jetpack-backup
 */

if ( ! function_exists( 'jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page' ) ) {
	/**
	 * Render the modernized Backup dashboard. No output is needed here — the
	 * tests only assert on which callback the menu selects.
	 *
	 * @return void
	 */
	function jetpack_backup_jetpack_backup_dashboard_wp_admin_render_page() {}
}
