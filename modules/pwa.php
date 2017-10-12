<?php

/**
 * Module Name: Progressive Web Apps
 * Module Description: Enable Progressive Web App (PWA) enhancements for mobile phones and offline browsing
 * Sort Order: 23
 * Recommendation Order: 13
 * First Introduced: 5.5
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Mobile, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, theme, pwa
 */

function jetpack_load_pwa() {
	include dirname( __FILE__ ) . "/pwa/pwa.php";
}

add_action( 'jetpack_modules_loaded', 'pwa_loaded' );

function pwa_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
}

jetpack_load_pwa();