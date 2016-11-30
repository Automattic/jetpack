<?php

/**
 * Module Name: Custom CSS
 * Module Description: Tweak your site’s CSS without modifying your theme.
 * Sort Order: 2
 * First Introduced: 1.7
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Appearance
 * Feature: Appearance
 * Additional Search Queries: css, customize, custom, style, editor, less, sass, preprocessor, font, mobile, appearance, theme, stylesheet
 */

function jetpack_load_custom_css() {
	// If WordPress has the core version of Custom CSS, load our new version.
	// @see https://core.trac.wordpress.org/changeset/38829
	if ( function_exists( 'wp_get_custom_css' ) ) {
		include dirname( __FILE__ ) . '/custom-css/custom-css-4.7.php';
		return;
	}

	include dirname( __FILE__ ) . "/custom-css/custom-css.php";
}

add_action( 'jetpack_modules_loaded', 'custom_css_loaded' );

function custom_css_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'custom_css_configuration_load' );
}

function custom_css_configuration_load() {
	wp_safe_redirect( admin_url( 'themes.php?page=editcss#settingsdiv' ) );
	exit;
}

jetpack_load_custom_css();
