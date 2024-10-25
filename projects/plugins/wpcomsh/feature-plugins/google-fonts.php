<?php
/**
 * Customizations to the Google Fonts module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/*
 * The old versions of Gutenberg that don't support the Font Library very well use this constant
 * to disable the Font Library. Leave it as it is to keep disabling the Font Library.
 */
if ( ! defined( 'FONT_LIBRARY_DISABLED' ) ) {
	define( 'FONT_LIBRARY_DISABLED', true );
}

/**
 * Force-enable the Google fonts module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_google_fonts_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
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
 * @param string|array $src The source URL of the enqueued style.
 * @return string|array
 */
function wpcomsh_google_fonts_proxy( $src ) {
	$src = str_replace( 'fonts.googleapis.com', 'fonts-api.wp.com', $src );
	$src = str_replace( 'fonts.gstatic.com', 'fonts.wp.com', $src );
	return $src;
}
add_filter( 'style_loader_src', 'wpcomsh_google_fonts_proxy' );
add_filter( 'wp_resource_hints', 'wpcomsh_google_fonts_proxy' );
add_filter( 'jetpack_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
add_filter( 'custom_fonts_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
add_filter( 'jetpack_global_styles_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
