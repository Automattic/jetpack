<?php
/**
 * Plugin Name: Boost E2E Dashboard Modernization
 *
 * @package automattic/jetpack-boost
 */

add_filter(
	'rsm_jetpack_ui_modernization_boost',
	function ( $enabled ) {
		return (bool) get_option( 'e2e_boost_dashboard_modernization', $enabled );
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		delete_option( 'e2e_boost_dashboard_modernization' );
	}
);
