<?php

/**
 * Module Name: Monitor
 * Module Description: Jetpack Monitor will keep tabs on your site, and alert you the moment that downtime is detected.
 * Sort Order: 55
 * First Introduced: 2.6
 * Requires Connection: Yes
 * Auto Activate: No
 */

function jetpack_monitor_toggle() {
	$jetpack = Jetpack::init();
	$jetpack->sync->register( 'noop' );

	if ( false !== strpos( current_filter(), 'jetpack_activate_module_' ) ) {
		Jetpack::check_privacy( __FILE__ );
	}
}

add_action( 'jetpack_activate_module_monitor', 'jetpack_monitor_toggle' );
add_action( 'jetpack_deactivate_module_monitor', 'jetpack_monitor_toggle' );

if ( $_SERVER['HTTP_USER_AGENT'] == 'jetmon' )
	@header( 'Jetpack: 1' );
