<?php

/**
 * Module Name: Site Verification Tools
 * Module Description: Quick tools to let you verify your site/domain with external services like Google Webmaster Tools.
 * First Introduced: 2.9
 * Sort Order: 55
 * Requires Connection: No
 * Auto Activate: Yes
 */

function jetpack_load_verification_tools() {
	include dirname( __FILE__ ) . "/verification-tools/blog-verification-tools.php";
}

function jetpack_verification_tools_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_verification_tools_configuration_load' );
}
add_action( 'jetpack_modules_loaded', 'jetpack_verification_tools_loaded' );

function jetpack_verification_tools_configuration_load() {
	wp_safe_redirect( admin_url( 'tools.php' ) );
	exit;
}

jetpack_load_verification_tools();
