<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package Jetpack.
 */

/* Jetpack Connection Testing Framework */
require_once 'class-jetpack-cxn-test-base.php';
/* Jetpack Connection Tests */
require_once 'class-jetpack-cxn-tests.php';

/* Jetpack Debug Data */
require_once 'class-jetpack-debug-data.php';
/* The "In-Plugin Debugger" admin page. */
require_once 'class-jetpack-debugger.php';

add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );
add_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' );
add_action( 'wp_ajax_health-check-jetpack-local_testing_suite', 'jetpack_debugger_ajax_local_testing_suite' );

/**
 * Test runner for Core's Site Health module.
 *
 * @since 7.3.0
 */
function jetpack_debugger_ajax_local_testing_suite() {
	check_ajax_referer( 'health-check-site-status' );
	if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
		wp_send_json_error();
	}
	$tests = new Jetpack_Cxn_Tests();
	wp_send_json_success( $tests->output_results_for_core_site_health() );
}

/**
 * Adds the Jetpack Local Testing Suite to the Core Site Health system.
 *
 * @since 7.3.0
 *
 * @param array $tests Array of tests from Core's Site Health.
 *
 * @return array $tests Array of tests for Core's Site Health.
 */
function jetpack_debugger_site_status_tests( $tests ) {
	$tests['async']['jetpack_test_suite'] = array(
		'label' => __( 'Jetpack Tests', 'jetpack' ),
		'test'  => 'jetpack_local_testing_suite',
	);

	return $tests;
}
