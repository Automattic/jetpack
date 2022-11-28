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

/**
 * Triggers when the Jetpack plugin is updated
 */
add_action( 'upgrader_process_complete', array( 'Automattic\Jetpack\Waf\Waf_Runner', 'update_waf' ) );

Automattic\Jetpack\Waf\Waf_Runner::initialize();
