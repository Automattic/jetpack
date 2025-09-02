<?php
/**
 * Module Name: Sharing
 * Module Description: Add customizable share buttons so visitors can spread your content.
 * Sort Order: 7
 * Recommendation Order: 6
 * First Introduced: 1.1
 * Major Changes In: 1.2
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Social, Recommended
 * Feature: Engagement
 * Additional Search Queries: share, sharing, sharedaddy, social buttons, buttons, share facebook, share twitter, social media sharing, social media share, social share, icons, email, facebook, twitter, linkedin, pinterest, pocket, social widget, social media
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! function_exists( 'sharing_init' ) ) {
	require __DIR__ . '/sharedaddy/sharedaddy.php';
}

add_action( 'jetpack_modules_loaded', 'sharedaddy_loaded' );

/**
 * Sharing module code loaded after all modules have been loaded.
 */
function sharedaddy_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	add_filter( 'jetpack_module_configuration_url_sharedaddy', 'get_sharing_buttons_customisation_url' );
}
