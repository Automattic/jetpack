<?php
/**
 * Add a WordPress.com Reader link to the admin bar.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Force-activate the Reader module
 */
function wpcomsh_activate_reader_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'wpcom-reader' ) ) {
		Jetpack::activate_module( 'wpcom-reader', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_reader_module', 0, 0 );

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
