<?php

/**
 * Module Name: Accelerated Mobile Pages
 * Module Description: Enable display of posts and pages in Google's Accelerated Mobile Pages (AMP) format
 * Sort Order: 22
 * Recommendation Order: 12
 * First Introduced: 5.1
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Mobile, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, theme, amp
 */

function jetpack_load_amp() {
	include dirname( __FILE__ ) . "/amp/amp.php";
}

add_action( 'jetpack_modules_loaded', 'amp_loaded' );

function amp_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	// Jetpack::module_configuration_load( __FILE__, 'amp_configuration_load' );
	// Jetpack::module_configuration_screen( __FILE__, 'amp_configuration_screen' );
}

jetpack_load_amp();
