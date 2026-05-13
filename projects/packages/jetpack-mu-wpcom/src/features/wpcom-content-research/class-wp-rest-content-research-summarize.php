<?php
/**
 * WP_REST_Content_Research_Summarize file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Content_Research_Summarize.
 *
 * Proxies summarize requests to the WPcom platform endpoint.
 */
class WP_REST_Content_Research_Summarize extends \WP_REST_Controller {

	/**
	 * WP_REST_Content_Research_Summarize constructor.
	 */
	public function __construct() {
		$this->namespace = 'content-research';
		$this->rest_base = '/summarize';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_summary' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'topic'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'results' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'object',
						),
					),
				),
			)
		);
	}

	/**
	 * Proxy the summarize request to the WPcom platform endpoint.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_summary( \WP_REST_Request $request ) {
		$body = Client::wpcom_json_api_request_as_user(
			'/content-research/summarize',
			'2',
			array(
				'method' => 'POST',
			),
			array(
				'topic'   => $request['topic'],
				'results' => $request['results'],
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
