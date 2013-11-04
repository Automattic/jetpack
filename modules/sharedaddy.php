<?php
/**
 * Module Name: Sharing
 * Module Description: The most super duper sharing tool on the interwebs. Share content with Facebook, Twitter, and many more.
 * Sort Order: 5
 * First Introduced: 1.1
 * Major Changes In: 1.2
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social
 */

if ( !function_exists( 'sharing_init' ) )
	include dirname( __FILE__ ).'/sharedaddy/sharedaddy.php';

add_action( 'jetpack_modules_loaded', 'sharedaddy_loaded' );

function sharedaddy_loaded() {
        Jetpack::enable_module_configurable( __FILE__ );
        Jetpack::module_configuration_load( __FILE__, 'sharedaddy_configuration_load' );
}

function sharedaddy_configuration_load() {
        wp_safe_redirect( menu_page_url( 'sharing', false ) . "#sharing-buttons" );
        exit;
}
