<?php
/**
 * Module Name: JSON API
 * Module Description: Allow applications to securely access your content through the cloud.
 * Sort Order: 100
 * First Introduced: 1.9
 */

function jetpack_json_api_toggle() {
	$jetpack = Jetpack::init();
	$jetpack->sync->register( 'noop' );

	if ( false !== strpos( current_filter(), 'jetpack_activate_module_' ) ) {
		Jetpack::check_privacy( __FILE__ );
	}
}

add_action( 'jetpack_activate_module_json-api',   'jetpack_json_api_toggle' );
add_action( 'jetpack_deactivate_module_json-api', 'jetpack_json_api_toggle' );
