<?php

/**
 * Module Name: Site Verification
 * Module Description: Establish your site's authenticity with external services.
 * First Introduced: 3.0
 * Sort Order: 33
 * Requires Connection: No
 * Auto Activate: Yes
 * Feature: Engagement
 * Additional Search Queries: webmaster, seo, google, bing, pinterest, search, console
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
