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

if ( Jetpack::active_plan_supports( 'google-analytics' ) ) {
	include dirname( __FILE__ ) . "/google-analytics/wp-google-analytics.php";
}
