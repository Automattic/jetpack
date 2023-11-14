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
 * Jetpack adds a redirect on Jetpack::deactivate_module() to the current page,
 * by adding a filter on wp_redirect which changes all redirect destinations.
 *
 * If we're calling Jetpack::deactivate_module() directly ourselves, we end up
 * breaking future redirects in the request.
 * This function is meant to unhook the filter that JP adds.
 */
function wpcomsh_jp_module_fix_redirect() {
	if ( has_filter( 'wp_redirect', 'wp_get_referer' ) ) {
		remove_filter( 'wp_redirect', 'wp_get_referer' );
	}
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

	// Google fonts was introduced in Jetpack 10.8.
	if ( version_compare( JETPACK__VERSION, '10.8', '<' ) ) {
		return;
	}

	// Hotfix to google fonts causing issues with Gutenberg 16.9 and specific themes
	// https://github.com/Automattic/wp-calypso/issues/83986
	$problematic_themes = array(
		'course',
		'pendant',
		'twentytwentytwo',
		'smithland',
		'awburn',
		'nokul',
		'ueno',
	);
	$incompatible_theme = false;
	$stylesheet         = get_option( 'stylesheet' );
	foreach ( $problematic_themes as $problematic_theme ) {
		if ( strpos( $stylesheet, $problematic_theme ) === 0 ) {
			$incompatible_theme = true;
			break;
		}
	}

	// Force-activate for safe themes and deactivate for the rest
	if ( ! Jetpack::is_module_active( 'google-fonts' ) && ! $incompatible_theme ) {
		Jetpack::activate_module( 'google-fonts', false, false );
	} elseif ( $incompatible_theme ) {
		add_action( 'jetpack_pre_deactivate_module', 'wpcomsh_jp_module_fix_redirect', 20, 0 );
		Jetpack::deactivate_module( 'google-fonts' );
		remove_action( 'jetpack_pre_deactivate_module', 'wpcomsh_jp_module_fix_redirect', 20, 0 );
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
