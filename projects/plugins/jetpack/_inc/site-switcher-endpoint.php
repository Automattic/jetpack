<?php
/**
 * Site Switcher REST API Endpoint
 * Jetpack-only endpoint for fetching compact sites list
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Register REST API endpoint to fetch compact sites list from WordPress.com
 */
function jetpack_site_switcher_register_rest_routes() {
	register_rest_route(
		'jetpack/v4',
		'/sites/compact',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'jetpack_site_switcher_get_sites',
			'permission_callback' => 'jetpack_site_switcher_permission_check',
		)
	);
}

/**
 * Check if the current user is connected to WordPress.com
 *
 * @return bool True if user is connected, false otherwise
 */
function jetpack_site_switcher_permission_check() {
	if ( ! is_user_logged_in() ) {
		return false;
	}

	$connection_manager = new Connection_Manager();
	return $connection_manager->is_user_connected();
}
add_action( 'rest_api_init', 'jetpack_site_switcher_register_rest_routes' );

/**
 * Fetch compact sites list from WordPress.com API
 *
 * @return WP_REST_Response|WP_Error
 */
function jetpack_site_switcher_get_sites() {
	$response = Client::wpcom_json_api_request_as_user(
		'/me/sites/compact',
		'v1.1',
		array( 'method' => 'GET' ),
		null,
		'rest'
	);

	if ( is_wp_error( $response ) ) {
		return new WP_Error(
			'jetpack_site_switcher_request_failed',
			sprintf(
				/* translators: %s: Error message from the API request */
				__( 'Failed to connect to WordPress.com: %s', 'jetpack' ),
				$response->get_error_message()
			),
			array( 'status' => 500 )
		);
	}

	$response_code = wp_remote_retrieve_response_code( $response );
	if ( 200 !== $response_code ) {
		return new WP_Error(
			'jetpack_site_switcher_api_error',
			sprintf(
				/* translators: %d: HTTP status code */
				__( 'WordPress.com API returned error (HTTP %d)', 'jetpack' ),
				$response_code
			),
			array( 'status' => $response_code )
		);
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( ! isset( $body['sites'] ) ) {
		return new WP_Error(
			'jetpack_site_switcher_invalid_response',
			__( 'WordPress.com API response missing sites data', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response( $body );
}
