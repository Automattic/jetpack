<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package Jetpack.
 */

global $wp_version;

/* Jetpack Connection Testing Framework */
require_once 'class-jetpack-cxn-test-base.php';
/* Jetpack Connection Tests */
require_once 'class-jetpack-cxn-tests.php';
/* Jetpack Debug Data */
require_once 'class-jetpack-debug-data.php';
/* The "In-Plugin Debugger" admin page. */
require_once 'class-jetpack-debugger.php';

if ( version_compare( $wp_version, '5.2-alpha', 'ge' ) ) {
	require_once 'debug-functions-for-php53.php';
	add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );
	add_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' );
	add_action( 'wp_ajax_health-check-jetpack-local_testing_suite', 'jetpack_debugger_ajax_local_testing_suite' );
}
