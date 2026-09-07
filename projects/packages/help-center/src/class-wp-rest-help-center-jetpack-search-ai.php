<?php
/**
 * WP_REST_Help_Center_Jetpack_Search_AI file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Jetpack_Search_AI.
 */
class WP_REST_Help_Center_Jetpack_Search_AI extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Jetpack_Search_AI constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/jetpack-search/ai';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/search',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_results' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Should return the sibyl articles.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function get_search_results( \WP_REST_Request $request ) {
		$query_parameters = array(
			'query'   => $request['query'],
			'stop_at' => $request['stop_at'],
		);
		$body             = $this->wpcom_request_client->request(
			'sites/' . $request['site'] . '/jetpack-search/ai/search?' . http_build_query( $query_parameters ),
			'2',
			array(
				'timeout' => 75,
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
