<?php

/**
 * Module Name: Google Analytics
 * Module Description: Lets you use <a href="http://analytics.google.com">Google Analytics</a> to track your WordPress site statistics.
 * First Introduced: 4.4
 * Sort Order: 37
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Engagement
 * Additional Search Queries: webmaster, google, analytics, console
 */

/**
 * Removes the Google Analytics plugin settings page
 */
function remove_settings_page() {
	remove_submenu_page( 'options-general.php', 'wp-google-analytics' );
}

include dirname( __FILE__ ) . "/google-analytics/wp-google-analytics.php";
add_action( 'admin_menu', 'remove_settings_page' );
