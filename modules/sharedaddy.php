<?php
/**
 * Module Name: Sharing
 * Module Description: Allow visitors to share your content.
 * Jumpstart Description: Twitter, Facebook and Google+ buttons at the bottom of each post, making it easy for visitors to share your content.
 * Sort Order: 7
 * Recommendation Order: 6
 * First Introduced: 1.1
 * Major Changes In: 1.2
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social, Recommended
 * Feature: Engagement, Jumpstart
 * Additional Search Queries: share, sharing, sharingbuttons, buttons, icons, email, facebook, twitter, google+, linkedin, pinterest, pocket, press this, print, reddit, tumblr
 */

if ( !function_exists( 'sharing_init' ) )
	include dirname( __FILE__ ).'/sharingbuttons/sharingbuttons.php';

add_action( 'jetpack_modules_loaded', 'sharingbuttons_loaded' );

function sharingbuttons_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'sharingbuttons_configuration_load' );
}

function sharingbuttons_configuration_load() {
	wp_safe_redirect( menu_page_url( 'sharing', false ) . "#sharing-buttons" );
	exit;
}
