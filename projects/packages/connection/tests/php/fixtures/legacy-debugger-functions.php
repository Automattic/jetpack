<?php
/**
 * Simulates the legacy Jetpack debugger's debug-functions.php.
 *
 * Used by Site_Health_Test to verify that the connection package defers
 * to the old Jetpack plugin when it detects this function exists.
 *
 * @package automattic/jetpack-connection
 */

/**
 * Stub for the legacy jetpack_debugger_site_status_tests function.
 *
 * @param array $tests Site Health tests.
 * @return array
 */
function jetpack_debugger_site_status_tests( $tests = array() ) {
	return $tests;
}
