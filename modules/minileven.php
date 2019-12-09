<?php

/**
 * Module Name: Mobile Theme
 * Module Description: Enable the Jetpack Mobile theme
 * Sort Order: 21
 * Recommendation Order: 11
 * First Introduced: 1.8
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Mobile, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, theme, minileven
 */

function jetpack_load_minileven() {
	include dirname( __FILE__ ) . "/minileven/minileven.php";

	if ( Jetpack_Options::get_option_and_ensure_autoload( 'wp_mobile_app_promos', '0' ) != '1' )
		remove_action( 'wp_mobile_theme_footer', 'jetpack_mobile_app_promo' );
}

add_action( 'jetpack_modules_loaded', 'minileven_loaded' );

function minileven_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
}

function minileven_theme_root( $theme_root ) {
	if ( jetpack_check_mobile() ) {
		return dirname( __FILE__ ) . '/minileven/theme';
	}

	return $theme_root;
}

add_filter( 'theme_root', 'minileven_theme_root' );

function minileven_theme_root_uri( $theme_root_uri ) {
	if ( jetpack_check_mobile() ) {
		return plugins_url( 'modules/minileven/theme', dirname( __FILE__ ) );
	}

	return $theme_root_uri;
}

add_filter( 'theme_root_uri', 'minileven_theme_root_uri' );

function minileven_enabled( $wp_mobile_disable_option ) {
	return true;
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_filter( 'option_wp_mobile_disable', 'minileven_enabled' );
}

jetpack_load_minileven();
