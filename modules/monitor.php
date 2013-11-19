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

	if ( ! $jetpack->current_user_is_connection_owner() ) {
		Jetpack::state( 'module', 'monitor' );
		Jetpack::state( 'error', 'master_user_required' );

		// Technically this call to `wp_safe_redirect` is not required because
		// `Jetpack::activate_module` already sets up a redirect. However, this
		// might not stay the case forever so it's clearer to do it here as well.
		wp_safe_redirect( Jetpack::admin_url( 'page=jetpack' ) );
		die;
	}

	$jetpack->sync->register( 'noop' );

	if ( false !== strpos( current_filter(), 'jetpack_activate_module_' ) ) {
		Jetpack::check_privacy( __FILE__ );
	}
}

add_action( 'jetpack_activate_module_monitor', 'jetpack_monitor_toggle' );
add_action( 'jetpack_deactivate_module_monitor', 'jetpack_monitor_toggle' );

