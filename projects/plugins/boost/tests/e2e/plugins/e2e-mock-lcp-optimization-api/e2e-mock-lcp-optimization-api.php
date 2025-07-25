<?php
/**
 * Plugin Name: Boost E2E LCP Optimization API Mocker
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;

// Continue to use the signed token verification bypass for e2e tests
add_filter( 'jetpack_boost_signed_with_blog_token_verify', '__return_true' );

// Register the mock API client
add_filter( 'jetpack_boost_api_client_class', 'e2e_mock_get_api_client_class' );

/**
 * Return the mock API client class name.
 *
 * @return string
 */
function e2e_mock_get_api_client_class() {
	// Load required classes for the mock API client
	if ( ! class_exists( 'E2E_Mock_LCP_API_Client' ) ) {
		require_once __DIR__ . '/class-e2e-mock-lcp-api-client.php';
	}

	return 'E2E_Mock_LCP_API_Client';
}

/**
 * Hook to simulate LCP analysis completion.
 */
add_action( 'e2e_mock_lcp_analysis_complete', 'e2e_mock_lcp_complete_analysis' );

/**
 * Simulate completion of LCP analysis by calling the update endpoint.
 */
function e2e_mock_lcp_complete_analysis() {
	error_log( 'E2E Mock: Completing LCP analysis' );

	// Get current cornerstone pages using the proper utility method
	$cornerstone_pages = Cornerstone_Utils::get_list();

	if ( empty( $cornerstone_pages ) ) {
		// Fallback to homepage if no cornerstone pages set
		$cornerstone_pages = array( home_url() );
	}

	error_log( 'E2E Mock: Processing cornerstone pages: ' . print_r( $cornerstone_pages, true ) );

	$pages_data = array();
	foreach ( $cornerstone_pages as $url ) {
		// Use the same method as the real system to prepare provider data
		$provider_data = Cornerstone_Utils::prepare_provider_data( $url );

		$pages_data[] = array(
			'key'     => $provider_data['key'],
			'url'     => $provider_data['url'],
			'success' => true,
			'reports' => array(
				'mobile'  => array(
					'success'     => true,
					'type'        => 'img',
					'selector'    => 'img.wp-post-image',
					'url'         => $url,
					'html'        => '<img class="wp-post-image" src="https://example.com/image.jpg" alt="Test">',
					'breakpoints' => array(
						array(
							'maxWidth'        => 768,
							'imageDimensions' => array(
								array(
									'width'  => 400,
									'height' => 300,
								),
							),
						),
					),
				),
				'desktop' => array(
					'success'     => true,
					'type'        => 'img',
					'selector'    => 'img.wp-post-image',
					'url'         => $url,
					'html'        => '<img class="wp-post-image" src="https://example.com/image.jpg" alt="Test">',
					'breakpoints' => array(
						array(
							'minWidth'        => 769,
							'imageDimensions' => array(
								array(
									'width'  => 800,
									'height' => 600,
								),
							),
						),
					),
				),
			),
		);
	}

	// Simulate WPCOM calling back our update endpoint
	$request_data = array(
		'success' => true,
		'data'    => $pages_data,
	);

	// Create a mock request to the update endpoint
	$request = new WP_REST_Request( 'POST', '/jetpack-boost/v1/lcp/update' );
	$request->set_body_params( $request_data );

	// Get the endpoint and process the mock data
	$update_endpoint = new \Automattic\Jetpack_Boost\REST_API\Endpoints\Update_LCP();
	$update_endpoint->response( $request );
}

/**
 * On deactivation, clear any LCP state.
 */
register_deactivation_hook( __FILE__, 'e2e_mock_lcp_purge' );
function e2e_mock_lcp_purge() {
	$state = new LCP_State();
	$state->clear();
}
