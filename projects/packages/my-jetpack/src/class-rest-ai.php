<?php
/**
 * Sets up the AI REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client as Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;

/**
 * Registers the REST routes for AI.
 */
class REST_AI {
	/**
	 * Constructor.
	 */
	public function __construct() {
		/*
		 * Check if the `jetpack/v4/jetpack-ai-jwt` endpoint is registered
		 * by the Jetpack plugin to avoid registering it again.
		 * In case it's not registered, register it
		 * to make it available for Jetpack products that depend on it.
		 */
		if ( ! self::is_rest_endpoint_registered( 'jetpack/v4', '/jetpack-ai-jwt' ) ) {
			register_rest_route(
				'jetpack/v4',
				'jetpack-ai-jwt',
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::get_openai_jwt',
					'permission_callback' => function () {
						return ( new Connection_Manager( 'jetpack' ) )->is_user_connected() && current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}

	/**
	 * Check if a specific REST endpoint is registered.
	 *
	 * @param string $namespace - The namespace of the endpoint.
	 * @param string $route     - The route of the endpoint.
	 * @return bool               True if the endpoint is registered, false otherwise.
	 */
	public static function is_rest_endpoint_registered( $namespace, $route ) {
		$server        = rest_get_server();
		$routes        = $server->get_routes();
		$full_endpoint = '/' . trim( $namespace, '/' ) . $route;
		return isset( $routes[ $full_endpoint ] );
	}

	/**
	 * Ask WPCOM for a JWT token to use for OpenAI completion.
	 */
	public static function get_openai_jwt() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/jetpack-openai-query/jwt",
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
			),
			wp_json_encode( array() ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! isset( $json->token ) ) {
			return new WP_Error( 'no-token', 'No token returned from WPCOM' );
		}

		return array(
			'token'   => $json->token,
			'blog_id' => $blog_id,
		);
	}
}
