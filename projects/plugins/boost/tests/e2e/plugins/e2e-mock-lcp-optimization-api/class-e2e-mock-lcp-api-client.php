<?php
/**
 * Mock API Client for LCP optimization testing.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;
use Automattic\Jetpack\Boost_Core\Lib\WPCOM_Boost_API_Client;

/**
 * Mock API Client for LCP optimization testing.
 *
 * This class implements the Boost_API_Client interface and specifically handles
 * LCP optimization requests by returning mock data, while delegating other
 * requests to the real WPCOM API client.
 */
class E2E_Mock_LCP_API_Client implements Boost_API_Client {

	/**
	 * The real API client instance for non-LCP requests.
	 *
	 * @var WPCOM_Boost_API_Client
	 */
	private $real_client;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->real_client = new WPCOM_Boost_API_Client();
	}

	/**
	 * Handle POST requests, intercepting LCP requests and delegating others.
	 *
	 * @param string  $path    - Request path.
	 * @param mixed[] $payload - Request payload.
	 * @param mixed[] $args    - Request arguments (optional, for compatibility).
	 * @return mixed
	 */
	public function post( $path, $payload = array(), $args = null ) {
		error_log( 'E2E_Mock_LCP_API_Client::post - path: ' . $path );

		// Intercept LCP requests
		if ( 'lcp' === $path ) {
			return $this->handle_lcp_request( $payload );
		}

		// Delegate other requests to the real client
		return $this->real_client->post( $path, $payload, $args );
	}

	/**
	 * Handle GET requests by delegating to the real client.
	 *
	 * @param string  $path  - Request path.
	 * @param mixed[] $query - Query parameters.
	 * @param mixed[] $args  - Request arguments (optional, for compatibility).
	 * @return mixed
	 */
	public function get( $path, $query = array(), $args = null ) {
		// For now, delegate all GET requests to the real client
		// If specific GET endpoints need mocking, they can be handled here
		return $this->real_client->get( $path, $query, $args );
	}

	/**
	 * Handle LCP optimization requests and return mock data.
	 *
	 * @param array $payload The request payload.
	 * @return array Mock response.
	 */
	private function handle_lcp_request( $payload ) {
		error_log( 'E2E_Mock_LCP_API_Client: Handling LCP request with payload: ' . print_r( $payload, true ) );

		// Start async "analysis" to simulate real behavior
		wp_schedule_single_event( time() + 2, 'e2e_mock_lcp_analysis_complete' );

		return array(
			'success' => true,
		);
	}
}
