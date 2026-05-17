<?php
/**
 * WP_REST_Content_Research_Search file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Content_Research_Search.
 *
 * Proxies search requests to the WPcom platform endpoint.
 */
class WP_REST_Content_Research_Search extends \WP_REST_Controller {

	/**
	 * WP_REST_Content_Research_Search constructor.
	 */
	public function __construct() {
		$this->namespace = 'content-research';
		$this->rest_base = '/search';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_results' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'topic'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'sources' => array(
						'type'    => 'array',
						'default' => array( 'hn', 'reader', 'googlenews' ),
						'items'   => array(
							'type' => 'string',
						),
					),
					'count'   => array(
						'type'    => 'integer',
						'default' => 10,
						'minimum' => 1,
						'maximum' => 20,
					),
				),
			)
		);
	}

	/**
	 * Proxy the search request to the WPcom platform endpoint.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_search_results( \WP_REST_Request $request ) {
		$query_parameters = array(
			'topic' => $request['topic'],
		);

		$sources = $request->get_param( 'sources' );
		if ( ! empty( $sources ) ) {
			$query_parameters['sources'] = $sources;
		}

		$count = $request->get_param( 'count' );
		if ( ! empty( $count ) ) {
			$query_parameters['count'] = $count;
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/content-research/search?' . http_build_query( $query_parameters )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
