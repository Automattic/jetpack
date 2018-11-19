<?php

/**
 * Module Name: Site verification
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
	add_filter( 'jetpack_module_configuration_url_verification-tools', 'jetpack_verification_tools_configuration_url' );
}
add_action( 'jetpack_modules_loaded', 'jetpack_verification_tools_loaded' );

function jetpack_verification_tools_configuration_url() {
	return admin_url( 'tools.php' );
}

jetpack_load_verification_tools();
