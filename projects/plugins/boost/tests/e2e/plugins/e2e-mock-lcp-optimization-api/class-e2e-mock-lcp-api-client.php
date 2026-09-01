<?php
/**
 * Mock API Client for LCP optimization testing.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;
use Automattic\Jetpack\Boost_Core\Lib\WPCOM_Boost_API_Client;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

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
		// Intercept LCP requests
		if ( 'lcp' === $path ) {
			return $this->handle_lcp_request();
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
	 * @return array Mock response.
	 */
	private function handle_lcp_request() {
		add_action(
			'shutdown',
			array( $this, 'trigger_lcp_analysis_completion' )
		);

		return array(
			'success' => true,
		);
	}

	private function create_lcp_analysis_mock_data() {
		$cornerstone_pages = Cornerstone_Utils::get_list();

		if ( empty( $cornerstone_pages ) ) {
			$cornerstone_pages = array( home_url() );
		}

		$viewport_template = array(
			'success'     => true,
			'type'        => 'img',
			'selector'    => 'img.wp-post-image',
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
		);

		$pages_data = array();
		foreach ( $cornerstone_pages as $url ) {
			$provider_data = Cornerstone_Utils::prepare_provider_data( $url );

			$viewport_template['url'] = $url;

			$pages_data[] = array(
				'key'     => $provider_data['key'],
				'url'     => $provider_data['url'],
				'success' => true,
				'reports' => array(
					'mobile'  => $viewport_template,
					'desktop' => $viewport_template,
				),
			);
		}

		// Simulate WPCOM calling back our update endpoint
		return array(
			'success' => true,
			'data'    => $pages_data,
		);
	}

	public function trigger_lcp_analysis_completion() {
		// Only proceed if we have a pending LCP state
		$lcp_state = new \Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State();
		if ( ! $lcp_state->is_pending() ) {
			return;
		}

		// Create a mock request to the update endpoint
		$request = new WP_REST_Request( 'POST', '/jetpack-boost/v1/lcp/update' );
		$request->set_body_params( $this->create_lcp_analysis_mock_data() );

		// Get the endpoint and process the mock data
		$update_endpoint = new \Automattic\Jetpack_Boost\REST_API\Endpoints\Update_LCP();
		$update_endpoint->response( $request );
	}
}
