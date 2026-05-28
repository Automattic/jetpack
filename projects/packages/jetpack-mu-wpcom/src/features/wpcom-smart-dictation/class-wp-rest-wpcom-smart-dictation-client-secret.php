<?php
/**
 * WP_REST_WPCOM_Smart_Dictation_Client_Secret file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\WPCOM_DICTATION;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_WPCOM_Smart_Dictation_Client_Secret.
 *
 * Proxies dictation client secret requests to the WPCOM platform endpoint.
 */
class WP_REST_WPCOM_Smart_Dictation_Client_Secret extends \WP_REST_Controller {

	/**
	 * Session keys supported by the WPCOM endpoint.
	 */
	private const SUPPORTED_SESSION_KEYS = array( 'instructions' );

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
				'callback'            => array( $this, 'create_client_secret' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'session' => array(
						'type'              => 'object',
						'required'          => false,
						'validate_callback' => array( $this, 'validate_session' ),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/settle',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'settle_session' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/remaining-time',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_remaining_time' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	/**
	 * Proxy the client secret request to the WPCOM platform endpoint.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_client_secret( \WP_REST_Request $request ) {
		$session = $request->get_param( 'session' );
		$payload = array();

		if ( $request->has_param( 'session' ) ) {
			$validation = $this->validate_session( $session );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}

			if ( is_object( $session ) ) {
				$session = get_object_vars( $session );
			}

			$payload['session'] = $session;
		}

		return $this->proxy_wpcom_request( '/dictation-client-secret', 'POST', $payload );
	}

	/**
	 * Proxy the current session settlement request to the WPCOM platform endpoint.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function settle_session() {
		return $this->proxy_wpcom_request( '/dictation-client-secret/settle', 'POST' );
	}

	/**
	 * Proxy the remaining dictation time request to the WPCOM platform endpoint.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_remaining_time() {
		return $this->proxy_wpcom_request( '/dictation-client-secret/remaining-time' );
	}

	/**
	 * Validate optional session data.
	 *
	 * @param mixed $session Session data.
	 * @return true|\WP_Error
	 */
	public function validate_session( $session ) {
		if ( null === $session ) {
			return true;
		}

		if ( is_object( $session ) ) {
			$session = get_object_vars( $session );
		}

		if ( ! is_array( $session ) ) {
			return new \WP_Error( 'rest_invalid_param', 'session must be an object.' );
		}

		$unsupported_keys = array_diff( array_keys( $session ), self::SUPPORTED_SESSION_KEYS );
		if ( ! empty( $unsupported_keys ) ) {
			return new \WP_Error( 'rest_invalid_param', 'session contains unsupported fields.' );
		}

		if ( isset( $session['instructions'] ) && ! is_string( $session['instructions'] ) ) {
			return new \WP_Error( 'rest_invalid_param', 'session.instructions must be a string.' );
		}

		return true;
	}

	/**
	 * Proxy a request to the WPCOM platform endpoint.
	 *
	 * @param string     $path   The WPCOM endpoint path.
	 * @param string     $method The request method.
	 * @param array|null $data   Optional request body data.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function proxy_wpcom_request( $path, $method = 'GET', $data = null ) {
		$request_args = array( 'method' => $method );

		if ( null === $data ) {
			$body = Client::wpcom_json_api_request_as_user(
				$path,
				'2',
				$request_args
			);
		} else {
			$body = Client::wpcom_json_api_request_as_user(
				$path,
				'2',
				$request_args,
				$data
			);
		}

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );
		$status   = wp_remote_retrieve_response_code( $body );

		return new \WP_REST_Response( $response, $status ? $status : 200 );
	}

	/**
	 * Backwards-compatible alias for the original callback name.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_client_secret( \WP_REST_Request $request ) {
		return $this->create_client_secret( $request );
	}
}
