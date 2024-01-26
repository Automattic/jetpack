<?php
/**
 * Customizations to the Google Fonts module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

/*
 * Disable the new Font Library feature in Gutenberg while the incompatibility quirks
 * with the Google Fonts module are being worked out. I couldn't find a way to tie this
 * to the presence of Jetpack+Google Fonts - in this context `Jetpack` is not available,
 * and if using actions (such as `muplugins_loaded` or `plugins_loaded`), then the constant
 * is either not available (because the Jetpack plugin hasn't been loaded) or you can't
 * guarantee the constant is defined *before* Gutenberg is loaded.
 *
 * The best solution I could find was to define it at this point, in that case, it is defined
 * before Gutenberg is loaded as `wpcomsh` is a must-use plugin.
 *
 * We can also assume Jetpack will always be available and Google fonts enabled as wpcomsh is
 * a WPCOM `mu-plugin` and Jetpack is always active in WPCOM sites.
 *
 * For more context, see: p1695320359288239/1694704864.359509-slack-C048CUFRGFQ
 */
if ( ! defined( 'FONT_LIBRARY_DISABLED' ) ) {
	define( 'FONT_LIBRARY_DISABLED', true );
}

/**
 * With Gutenberg 17.6 and above, it allows us to disable the Font Library UI by the editor settings.
 *
 * For more context, see: https://github.com/WordPress/gutenberg/pull/57818/.
 */
add_filter(
	'block_editor_settings_all',
	function ( $settings ) {
		$settings['fontLibraryEnabled'] = isset( $_GET['enable_font_library_ui'] ); // phpcs:ignore WordPress.Security.NonceVerification
		return $settings;
	}
);

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
