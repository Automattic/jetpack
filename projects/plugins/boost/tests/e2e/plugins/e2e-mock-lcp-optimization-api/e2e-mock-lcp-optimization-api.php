<?php
/**
 * Plugin Name: Boost E2E LCP Optimization API Mocker
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;

// Continue to use the signed token verification bypass for e2e tests
add_filter( 'jetpack_boost_signed_with_blog_token_verify', '__return_true' );

// Register the mock API client
add_filter(
	'jetpack_boost_api_client_class',
	function () {
		// Load required classes for the mock API client
		if ( ! class_exists( 'E2E_Mock_LCP_API_Client' ) ) {
			require_once __DIR__ . '/class-e2e-mock-lcp-api-client.php';
		}

		return 'E2E_Mock_LCP_API_Client';
	}
);

/**
 * On deactivation, clear any LCP state.
 */
register_deactivation_hook(
	__FILE__,
	function () {
		$state = new LCP_State();
		$state->clear();
	}
);
