<?php

/**
 * Module Name: WordPress.com Connect
 * Module Description: Let users login with their WordPress.com Credentials, through <a href="http://jetpack.me/support/wpcc/">WordPress.com Connect</a>
 * Sort Order: 50
 * First Introduced: 2.4
 * Requires Connection: No
 * Auto Activate: No
 */

if ( ! class_exists( 'WPCC_Sign_On' ) )
	require_once( dirname( __FILE__ ) . '/wpcc/wpcc-sign-on.php' );

add_action( 'jetpack_modules_loaded', 'jetpack_wpcc_loaded' );
function jetpack_wpcc_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_wpcc_configuration_load' );
}

function jetpack_wpcc_configuration_load() {
	wp_safe_redirect( admin_url( 'options-general.php#wpcc-sign-on-section' ) );
	exit;
}
