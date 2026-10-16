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

/**
 * Skips Custom Fonts output when the active theme has no annotation rules for the chosen fonts.
 *
 * Fonts saved under a classic theme's Customizer keep loading after switching to a block theme
 * (or any unannotated theme) because maybe_render_fonts() only checks that fonts are saved, not
 * that any CSS rules exist for them. This guard runs first and removes the action so neither the
 * WebFont script nor the empty <style> block appear on the page.
 *
 * The jetpack_fonts_render_without_rules filter lets sites that reference the chosen font
 * in Additional CSS opt back in to downloading it even without annotation rules.
 */
function wpcomsh_maybe_skip_custom_fonts() {
	if ( ! class_exists( 'Jetpack_Fonts' ) ) {
		return;
	}
	// Jetpack_Fonts is declared in both the wpcom stubs and vendor/automattic/custom-fonts; the stub lacks get_font_css().
	$instance = Jetpack_Fonts::get_instance(); // @phan-suppress-current-line PhanRedefinedClassReference
	// @phan-suppress-next-line PhanRedefinedClassReference, PhanUndeclaredMethod
	if ( '' === trim( $instance->get_font_css() ) && ! apply_filters( 'jetpack_fonts_render_without_rules', false ) ) {
		remove_action( 'wp_enqueue_scripts', array( $instance, 'maybe_render_fonts' ) );
	}
}
// Priority 5 runs before maybe_render_fonts (priority 10).
add_action( 'wp_enqueue_scripts', 'wpcomsh_maybe_skip_custom_fonts', 5 );
