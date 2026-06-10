<?php
/**
 * WP_REST_Jetpack_AI_JWT file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;

/**
 * Class WP_REST_Jetpack_AI_JWT.
 */
class WP_REST_Jetpack_AI_JWT extends \WP_REST_Controller {

	/**
	 * WP_REST_Jetpack_AI_JWT constructor.
	 */
	public function __construct() {
		$this->namespace = 'jetpack/v4';
		$this->rest_base = '/jetpack-ai-jwt';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		/*
		 * Check if the `jetpack/v4/jetpack-ai-jwt` endpoint is registered
		 * by the Jetpack plugin to avoid registering it again.
		 * In case it's not registered, register it
		 * to make it available for Jetpack products that depend on it.
		 */
		if ( $this->is_rest_endpoint_registered() ) {
			return;
		}

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'get_jwt' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
			)
		);
	}

	/**
	 * Check if this REST endpoint is already registered.
	 *
	 * @return bool True if the endpoint is registered, false otherwise.
	 */
	private function is_rest_endpoint_registered() {
		$server        = rest_get_server();
		$routes        = $server->get_routes();
		$full_endpoint = '/' . trim( $this->namespace, '/' ) . $this->rest_base;

		return isset( $routes[ $full_endpoint ] );
	}

	/**
	 * Permission callback for the JWT endpoint.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return ( new Connection_Manager( 'jetpack' ) )->is_user_connected() && current_user_can( 'edit_posts' );
	}

	/**
	 * Ask WPCOM for a JWT token to use for OpenAI completion.
	 */
	public function get_jwt() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/jetpack-openai-query/jwt",
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
			),
			wp_json_encode( array(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! isset( $json->token ) ) {
			return new \WP_Error(
				'no-token',
				'No token returned from WPCOM',
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'token'   => $json->token,
				'blog_id' => $blog_id,
			)
		);
	}
}
