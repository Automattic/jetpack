<?php
/**
 * Module Name: Manage
 * Module Description: Manage all your sites from a centralized place, https://wordpress.com/sites.
 * Jumpstart Description: Helps you remotely manage plugins, turn on automated updates, and more from <a href="https://wordpress.com/plugins/" target="_blank">wordpress.com</a>.
 * Sort Order: 1
 * Recommendation Order: 3
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Centralized Management, Recommended
 * Feature: Recommended, Jumpstart
 */

add_action( 'jetpack_activate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'jetpack_deactivate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'customize_register', 'add_wpcom_to_allowed_redirect_hosts' );

// Add wordpress.com to the safe redirect whitelist if the Manage module is enabled
// so the customizer can `return` to wordpress.com if invoked from there.
function add_wpcom_to_allowed_redirect_hosts( $domains ) {
	if ( Jetpack::is_module_active( 'manage' ) ) {
		add_filter( 'allowed_redirect_hosts', 'allow_wpcom_domain' );
	}
}

// Return $domains, with 'wordpress.com' appended.
function allow_wpcom_domain( $domains ) {
	if ( empty( $domains ) ) {
		$domains = array();
	}
	$domains[] = 'wordpress.com';
	return array_unique( $domains );
}

// Re add sync for non public posts when the optin is selected in Calypso.
// This will only work if you have manage enabled as well.
if ( Jetpack_Options::get_option( 'sync_non_public_post_stati' ) ) {
	$sync_options = array(
		'post_types' => get_post_types( array( 'public' => true ) ),
		'post_stati' => get_post_stati(),
	);
	Jetpack_Sync::sync_posts( __FILE__, $sync_options );
}
