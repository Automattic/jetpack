<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/* Jetpack Connection Testing Framework */
require_once __DIR__ . '/debugger/class-jetpack-cxn-test-base.php';
/* Jetpack Connection Tests */
require_once __DIR__ . '/debugger/class-jetpack-cxn-tests.php';
/* Jetpack Debug Data */
require_once __DIR__ . '/debugger/class-jetpack-debug-data.php';
/* The "In-Plugin Debugger" admin page. */
require_once __DIR__ . '/debugger/class-jetpack-debugger.php';

add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );

/*
 * Use the beta support group URL for development versions of Jetpack.
 */
add_filter(
	'jetpack_connection_support_url',
	function ( $url ) {
		if ( Jetpack::is_development_version() ) {
			return Automattic\Jetpack\Redirect::get_url( 'jetpack-contact-support-beta-group' );
		}
		return $url;
	}
);

/*
 * Provide the Jetpack reconnect URL for connection health test failures.
 */
add_filter(
	'jetpack_connection_reconnect_url',
	function () {
		return admin_url( 'admin.php?page=jetpack#/reconnect' );
	}
);

// Note: Jetpack-specific test registration via jetpack_connection_tests_loaded
// has moved to class.jetpack.php so it runs on all requests (not just admin).
