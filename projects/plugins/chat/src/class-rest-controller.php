<?php
/**
 * REST API Endpoints
 *
 * @package automattic/jetpack-chat
 */

namespace Automattic\Jetpack\Chat;

use Automattic\Jetpack\Connection\Client;

/**
 * Makes REST API Endpoints for Chat
 *
 * @package Automattic\Jetpack\Chat
 */
class REST_Controller {

	/**
	 * Namespace.
	 *
	 * @var string $namespace The namespace for the REST API.
	 */
	public static $namespace = 'jetpack/v4/chat';

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up REST API routes.
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API
	 */
	public function register_rest_routes() {
		// Get migration status from source site.
		register_rest_route(
			static::$namespace,
			'/odie/start_chat',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'start_chat' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * Gets the current migration for this source site.
	 *
	 * GET `jetpack/v4/chat/odie/start_chat`
	 *
	 * @param WP_REST_Request $req The REST request object.
	 */
	public function start_chat( $req ) {
		$response = Client::wpcom_json_api_request_as_user(
			'/odie/start_chat',
			'2',
			array( 'method' => 'POST' ),
			$req->get_body(),
			'wpcom'
		);

		return rest_ensure_response( $this->make_proper_response( $response ) );
	}

	/**
	 * Permissions check for start_chat.
	 *
	 * @return bool|WP_Error True if permission granted.
	 */
	public function permissions_check() {
		// TODO: How are site visitors going to chat?
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-chat'
		);

		return new \WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	private function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new \WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}
}
