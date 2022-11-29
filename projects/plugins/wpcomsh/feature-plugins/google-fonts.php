<?php
/**
 * Customizations to the Google Fonts module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Force-enable the Google fonts module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_google_fonts_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Google fonts was introduced in Jetpack 10.8.
	if ( version_compare( JETPACK__VERSION, '10.8', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'google-fonts' ) ) {
		Jetpack::activate_module( 'google-fonts', false, false );
	}
}
add_action( 'setup_theme', 'wpcomsh_activate_google_fonts_module' );

/**
 * Remove Google Fonts from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function wpcomsh_rm_google_fonts_module_list( $items ) {
	if ( isset( $items['google-fonts'] ) ) {
		unset( $items['google-fonts'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_google_fonts_module_list' );

/**
 * Replaces Google Fonts API references in enqueued styles with our caching reverse proxy.
 *
 * @see pMz3w-g6E-p2#comment-103418
 *
 * @param string $src The source URL of the enqueued style.
 * @return string
 */
function wpcomsh_google_fonts_proxy( $src ) {
	return str_replace( 'fonts.googleapis.com', 'fonts-api.wp.com', $src );
}
add_filter( 'style_loader_src', 'wpcomsh_google_fonts_proxy' );
add_filter( 'wp_resource_hints', 'wpcomsh_google_fonts_proxy' );
