<?php
/**
 * REST API endpoint for Gutenberg RTC PingHub token generation.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * REST controller that generates short-lived JWTs for PingHub WebSocket auth.
 */
class WP_REST_Gutenberg_RTC extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'gutenberg-rtc/pinghub-token';
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check: current user must be a member of the blog.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! is_user_member_of_blog() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You are not allowed to access this endpoint.', 'jetpack-mu-wpcom' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Generate a short-lived JWT for authenticating PingHub WebSocket connections.
	 *
	 * On simple WordPress.com sites sign_JWT() is called directly — the REST
	 * endpoint files are not loaded in the admin context so rest_do_request
	 * cannot be used. On Jetpack/Atomic sites it is fetched from the WPCOM API
	 * over the Jetpack connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$blog_id = get_wpcom_blog_id();

		if ( ! $blog_id ) {
			return new WP_Error(
				'rest_pinghub_token_error',
				__( 'Could not determine blog ID.', 'jetpack-mu-wpcom' ),
				array( 'status' => 500 )
			);
		}

		$token = $this->generate_token( $blog_id );

		if ( $token === null ) {
			return new WP_Error(
				'rest_pinghub_token_error',
				__( 'Could not generate PingHub token.', 'jetpack-mu-wpcom' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array( 'token' => $token ) );
	}

	/**
	 * Generate the JWT token for PingHub authentication.
	 *
	 * @param int $blog_id The blog ID.
	 * @return string|null Signed JWT, or null on failure.
	 */
	private function generate_token( $blog_id ) {
		// Simple WordPress.com sites: use the internal REST endpoint.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$request  = new \WP_REST_Request( 'POST', "/wpcom/v2/sites/$blog_id/jetpack-pinghub/jwt/sign" );
			$response = rest_do_request( $request );

			if ( $response->is_error() ) {
				return null;
			}

			$data = $response->get_data();
			return $data['jwt'] ?? null;
		}

		// Jetpack/Atomic: call the WPCOM endpoint over the Jetpack connection.
		if ( ! class_exists( 'Automattic\Jetpack\Connection\Client' ) ) {
			return null;
		}

		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/jetpack-pinghub/jwt/sign",
			'2',
			array( 'method' => 'POST' )
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		return $body['jwt'] ?? null;
	}
}
