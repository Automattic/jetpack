<?php
/**
 * Module Name: Manage
 * Module Description: Manage all of your sites from a centralized dashboard.
 * Jumpstart Description: Helps you remotely manage plugins, turn on automated updates, and more from <a href="https://wordpress.com/plugins/" target="_blank">wordpress.com</a>.
 * Sort Order: 1
 * Recommendation Order: 3
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Centralized Management, Recommended
 * Feature: Health, Jumpstart
 * Additional Search Queries: manage, management, remote
 */
add_action( 'customize_register', 'add_wpcom_to_allowed_redirect_hosts' );
add_action( 'jetpack_activate_module_manage', 'jetpack_manage_set_default_options' );
add_action( 'jetpack_update_default_options_module_manage', 'jetpack_manage_set_default_options' );


// Add wordpress.com to the safe redirect whitelist if the Manage module is enabled
// so the customizer can `return` to wordpress.com if invoked from there.
function add_wpcom_to_allowed_redirect_hosts( $domains ) {
	if ( Jetpack::is_module_active( 'manage' ) ) {
		add_filter( 'allowed_redirect_hosts', 'allow_wpcom_domain' );
	}
}

/**
 * Set default option upon activation
 */
function jetpack_manage_set_default_options() {
	if ( false === Jetpack_Options::get_option( 'sync_non_public_post_stati' ) ) {
		Jetpack_Options::update_option( 'sync_non_public_post_stati', 0 );
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

Jetpack::module_configuration_screen( 'manage', 'jetpack_manage_config_screen' );
function jetpack_manage_config_screen() {
	include ( JETPACK__PLUGIN_DIR . 'modules/manage/confirm-admin.php' );
}
