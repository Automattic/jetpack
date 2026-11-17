<?php
/**
 * Add a WordPress.com Reader link to the admin bar.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Force-activate the Reader module, and report it as forced on.
 */
function wpcomsh_activate_reader_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'wpcom-reader' ) ) {
		Jetpack::activate_module( 'wpcom-reader', false, false );
	}

	// After activating, for the reason given in wpcomsh_force_activate_blaze_module().
	if ( Jetpack::is_module_active( 'wpcom-reader' ) ) {
		add_filter( 'jetpack_active_modules', 'wpcomsh_report_forced_reader_module' );
	}
}
add_action( 'init', 'wpcomsh_activate_reader_module', 0, 0 );

/**
 * Add Reader to the active modules, which Jetpack reads as forced on and locks its switch.
 *
 * @param array $modules Active module slugs.
 * @return array
 */
function wpcomsh_report_forced_reader_module( $modules ) {
	return array_merge( (array) $modules, array( 'wpcom-reader' ) );
}

/**
 * Remove Reader from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function wpcomsh_rm_reader_module_list( $items ) {
	if ( isset( $items['wpcom-reader'] ) ) {
		unset( $items['wpcom-reader'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_reader_module_list' );
