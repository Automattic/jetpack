<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../../vendor/autoload.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

// Mock version of `wpcom_is_vip()` function for testing `Host::is_vip_site()`.
$wpcom_is_vip = false; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
function wpcom_is_vip( $blog_id = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	global $wpcom_is_vip;
	return $wpcom_is_vip;
}
