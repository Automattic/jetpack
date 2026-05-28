<?php
/**
 * WP_REST_WPCOM_Smart_Dictation_Client_Secret file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_WPCOM_Smart_Dictation_Client_Secret.
 *
 * Proxies dictation client secret requests to the WPCOM platform endpoint.
 */
class WP_REST_WPCOM_Smart_Dictation_Client_Secret extends \WP_REST_Controller {

	/**
	 * WP_REST_WPCOM_Smart_Dictation_Client_Secret constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = '/dictation-client-secret';
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
				'callback'            => array( $this, 'get_client_secret' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'session' => array(
						'type'     => 'object',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Proxy the client secret request to the WPCOM platform endpoint.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_client_secret( \WP_REST_Request $request ) {
		$session = $request->get_param( 'session' );

		if ( is_object( $session ) ) {
			$session = get_object_vars( $session );
		}

		if ( ! is_array( $session ) || ! isset( $session['instructions'] ) || ! is_string( $session['instructions'] ) ) {
			return new \WP_Error(
				'invalid_session',
				'The session.instructions field is required.',
				array( 'status' => 400 )
			);
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/dictation-client-secret',
			'2',
			array( 'method' => 'POST' ),
			array(
				'session' => array(
					'instructions' => $session['instructions'],
				),
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
