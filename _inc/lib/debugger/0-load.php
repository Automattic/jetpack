<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package Jetpack.
 */

/* The "In-Plugin Debugger" admin page. */
require_once 'class-jetpack-debugger.php';

add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );
add_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' );
add_action( 'wp_ajax_health-check-jetpack-local_testing_suite', 'jetpack_debugger_ajax_local_testing_suite' );
