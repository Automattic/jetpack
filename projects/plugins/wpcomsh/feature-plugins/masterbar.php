<?php
/**
 * Customizations to the Masterbar module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Force-enable the Masterbar module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_masterbar_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Masterbar was introduced in Jetpack 4.8.
	if ( version_compare( JETPACK__VERSION, '4.8', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
		Jetpack::activate_module( 'masterbar', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_masterbar_module', 0, 0 );

/**
 * Remove Masterbar from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 */
function wpcomsh_rm_masterbar_module_list( $items ) {
	if ( isset( $items['masterbar'] ) ) {
		unset( $items['masterbar'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_masterbar_module_list' );

/**
 * Prints the calypso page link for changing a color scheme.
 **/
function wpcomsh_admin_color_scheme_picker_disabled() {
	printf(
		'<a target="_blank" href="%1$s">%2$s</a>',
		esc_url( 'https://wordpress.com/me/account' ),
		esc_html( __( 'Set your color scheme on WordPress.com.', 'wpcomsh' ) )
	);
}

/**
 * Hides the "Admin Color Scheme" entry on /wp-admin/profile.php,
 * and adds an action that prints a calypso page link.
 *
 * This code should only run if the use has only the default color schemes ( wp-admin + calypso = 18 ).
 **/
function wpcomsh_hide_color_schemes() {
	if ( 18 === count( $GLOBALS['_wp_admin_css_colors'] ) ) {
		remove_action( 'admin_color_scheme_picker', 'admin_color_scheme_picker' );
		add_action( 'admin_color_scheme_picker', 'wpcomsh_admin_color_scheme_picker_disabled' );
	}
}
add_action( 'load-profile.php', 'wpcomsh_hide_color_schemes' );
