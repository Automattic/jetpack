<?php
/**
 * Plugin Name: Boost E2E Critical CSS Advanced Recommendations
 * Description: Force errors in the Critical CSS Advanced Recommendations for E2E testing purposes
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 * Requires at least: 5.0
 * Requires PHP: 7.0
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'template_redirect',
	function () {
		// Only for testing purposes - normally would require nonce verification
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['cat'] ) && isset( $_GET['jb-generate-critical-css'] ) ) {
			header( 'HTTP/1.0 500 Internal Server Error' );
			die();
		}
	}
);
