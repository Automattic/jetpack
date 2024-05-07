<?php
/**
 * Module Name: Google Analytics
 * Module Description: Set up Google Analytics without touching a line of code.
 * First Introduced: 4.5
 * Sort Order: 37
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Engagement
 * Additional Search Queries: webmaster, google, analytics, console
 * Plans: business, premium, security, complete
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Google_Analytics\GA_Manager;

// Load the old classes for backward compatibility.
require __DIR__ . '/google-analytics/wp-google-analytics.php';

global $jetpack_google_analytics;
$jetpack_google_analytics = GA_Manager::get_instance();
