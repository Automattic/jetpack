<?php
/**
 * Bootstrap file for the nudges.
 *
 * @package Jetpack
 */

/**
 * The WP_Customize_Control core class is loaded only on customize_register.
 */
function register_css_nudge_control() {
	require_once __DIR__ . '/css-nudge/class-css-nudge-customize-control.php';
}

add_action( 'customize_register', 'register_css_nudge_control', 1 );

require_once __DIR__ . '/css-nudge/class-wpcom-css-customizer-nudge.php';
