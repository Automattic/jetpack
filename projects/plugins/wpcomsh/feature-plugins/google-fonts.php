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
 * Option that records an explicit user opt-out of the Google Fonts module.
 *
 * When set, wpcomsh stops force-activating the module on every request so the
 * user's deactivation (e.g. via My Jetpack) actually sticks.
 */
const WPCOMSH_GOOGLE_FONTS_OPTED_OUT = 'wpcomsh_google_fonts_opted_out';

/**
 * Force-enable the Google fonts module
 * If you use a version of Jetpack that supports it,
 * if it is not already enabled,
 * and if the user has not explicitly deactivated it.
 */
function wpcomsh_activate_google_fonts_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Respect an explicit user deactivation instead of re-enabling on every request.
	if ( get_option( WPCOMSH_GOOGLE_FONTS_OPTED_OUT ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'google-fonts' ) ) {
		Jetpack::activate_module( 'google-fonts', false, false );
	}
}
add_action( 'setup_theme', 'wpcomsh_activate_google_fonts_module' );

/**
 * Record that the user has explicitly deactivated the Google Fonts module so
 * wpcomsh stops force-activating it on subsequent requests.
 */
function wpcomsh_google_fonts_opt_out() {
	update_option( WPCOMSH_GOOGLE_FONTS_OPTED_OUT, true );
}
add_action( 'jetpack_deactivate_module_google-fonts', 'wpcomsh_google_fonts_opt_out' );

/**
 * Clear the opt-out when the user re-activates the Google Fonts module so the
 * default "always available on Atomic" behavior resumes.
 */
function wpcomsh_google_fonts_opt_in() {
	delete_option( WPCOMSH_GOOGLE_FONTS_OPTED_OUT );
}
add_action( 'jetpack_activate_module_google-fonts', 'wpcomsh_google_fonts_opt_in' );

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
