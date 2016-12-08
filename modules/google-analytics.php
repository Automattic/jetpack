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
function removeSettingsPage() {
	remove_submenu_page( 'options-general.php', 'wp-google-analytics' );
}

/**
 * Does the site have a Jetpack plan attached to it that includes Google Analytics?
 *
 * @return bool
 */
function isGoogleAnalyticsIncludedInJetpackPlan() {
	$site_id = Jetpack_Options::get_option( 'id' );
	$result  = Jetpack_Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ), '1.1' );

	if ( is_wp_error( $result ) ) {
		return false;
	}

	$response = json_decode( $result['body'], true );

	return $response['plan']['product_slug'] == 'jetpack_business';
}

include dirname( __FILE__ ) . "/google-analytics/wp-google-analytics.php";
add_action( 'admin_menu', 'removeSettingsPage' );
