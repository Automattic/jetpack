<?php
/**
 * Module Name: Firewall
 * Module Description: Protect your site with Jetpack's Web Application Firewall
 * Sort Order: 5
 * First Introduced: 10.9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Firewall, WAF
 * Feature: Security
 *
 * @package automattic/jetpack
 */

// Do not run in the WPCOM context
if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	return;
}

// Check if killswitch is defined as true
if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
	return;
}

if ( ( new Automattic\Jetpack\Status\Host() )->is_atomic_platform() ) {
	add_filter(
		'jetpack_get_available_modules',
		function ( $modules ) {
			unset( $modules['waf'] );

			return $modules;
		}
	);
}

/**
 * Triggers when the Jetpack plugin is updated
 * TODO: if this is hooking into whatever plugin is running it, then this can be moved to the class instead
 */
add_action( 'upgrader_process_complete', array( 'Automattic\Jetpack\Waf_Runner', 'update_rules_if_changed' ) );

// TODO: This may still need to be wrapped in the plugins loaded action hook?
Automattic\Jetpack\Waf\Waf_Runner::initialize();
