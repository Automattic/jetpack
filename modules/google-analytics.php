<?php

/**
 * Module Name: Google Analytics
 * Module Description: MODULE DESCRIPTION COPY.
 * First Introduced: 4.4
 * Sort Order: 35
 * Requires Connection: No
 * Auto Activate: Yes
 * Feature: Engagement
 * Additional Search Queries: webmaster, google, analytics, console
 */

function jetpack_load_google_analytics() {
	include dirname( __FILE__ ) . "/google-analytics/wp-google-analytics/wp-google-analytics.php";
}

function jetpack_google_analytics_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_google_analytics_configuration_load' );
}

jetpack_load_google_analytics();
