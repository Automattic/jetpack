<?php
/**
 * Customizations to the Blaze feature.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Force-enable the Blaze module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_blaze_module() {
	if (
		! defined( 'JETPACK__VERSION' )
		|| ! class_exists( 'Jetpack' )
		|| 'wp-admin' === get_option( 'wpcom_admin_interface' )
	) {
		return;
	}

	// Blaze was introduced in Jetpack 12.3-a.9.
	if ( version_compare( JETPACK__VERSION, '12.3-a.9', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'blaze' ) ) {
		Jetpack::activate_module( 'blaze', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_blaze_module', 0, 0 );

/**
 * Remove Blaze from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function wpcomsh_rm_blaze_module_list( $items ) {
	if ( isset( $items['blaze'] ) && ! wpcom_is_nav_redesign_enabled() ) {
		unset( $items['blaze'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_blaze_module_list' );
