<?php

/**
 * Module Name: Custom CSS
 * Module Description: Customize the appearance of your site using CSS but without modifying your theme.
 * Sort Order: 11
 * First Introduced: 1.7
 * Requires Connection: No
 */

function jetpack_load_custom_css() {
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