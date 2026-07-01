<?php
/**
 * Customizations to the Google Fonts module available in Jetpack.
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
 * Replaces Google Fonts API references in enqueued styles with our caching reverse proxy.
 *
 * @see pMz3w-g6E-p2#comment-103418
 *
 * @param string|array $src The source URL of the enqueued style.
 * @return string|array
 */
function wpcomsh_google_fonts_proxy( $src ) {
	// If an array, run the function on each item.
	if ( is_array( $src ) ) {
		return array_map( 'wpcomsh_google_fonts_proxy', $src );
	}
	$src = str_replace( 'fonts.googleapis.com', 'fonts-api.wp.com', $src );
	$src = str_replace( 'fonts.gstatic.com', 'fonts.wp.com', $src );
	return $src;
}
add_filter( 'style_loader_src', 'wpcomsh_google_fonts_proxy' );
add_filter( 'wp_resource_hints', 'wpcomsh_google_fonts_proxy' );
add_filter( 'jetpack_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
add_filter( 'custom_fonts_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
add_filter( 'jetpack_global_styles_google_fonts_api_url', 'wpcomsh_google_fonts_proxy' );
