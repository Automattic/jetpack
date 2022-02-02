<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package automattic/jetpack
 */

/* Jetpack Connection Testing Framework */
require_once __DIR__ . '/debugger/class-jetpack-cxn-test-base.php';
/* Jetpack Connection Tests */
require_once __DIR__ . '/debugger/class-jetpack-cxn-tests.php';
/* Jetpack Debug Data */
require_once __DIR__ . '/debugger/class-jetpack-debug-data.php';
/* The "In-Plugin Debugger" admin page. */
require_once __DIR__ . '/debugger/class-jetpack-debugger.php';
/* General Debugging Functions */
require_once __DIR__ . '/debugger/debug-functions.php';

add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );
add_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' );
add_action( 'wp_ajax_health-check-jetpack-local_testing_suite', 'jetpack_debugger_ajax_local_testing_suite' );
add_action( 'admin_enqueue_scripts', 'jetpack_debugger_enqueue_site_health_scripts' );
add_action( 'wp_ajax_jetpack_sync_progress_check', 'jetpack_debugger_sync_progress_ajax' );
add_action( 'wp_ajax_jetpack_debugger_full_sync_start', 'jetpack_debugger_full_sync_start' );
