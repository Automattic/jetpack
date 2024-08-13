<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Module Name: Custom CSS
 * Module Description: Adds options for CSS preprocessor use, disabling the theme's CSS, or custom image width.
 * Sort Order: 2
 * First Introduced: 1.7
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance
 * Feature: Appearance
 * Additional Search Queries: css, customize, custom, style, editor, less, sass, preprocessor, font, mobile, appearance, theme, stylesheet
 */

if ( ! function_exists( 'custom_css_loaded' ) ) {
	/**
	 * Enable CSS module.
	 */
	function custom_css_loaded() {
		Jetpack::enable_module_configurable( __FILE__ );
	}
}

// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
if ( ! apply_filters( 'jetpack_module_configurable_custom-css', null ) ) {
	add_action( 'jetpack_modules_loaded', 'custom_css_loaded' );
}
