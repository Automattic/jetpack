<?php
/**
 * Jetpack WP.com request client.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Sends WP.com requests through Jetpack Connection or anonymously.
 */
final class Jetpack_Wpcom_Request_Client implements Wpcom_Request_Client {
	/**
	 * Whether the current user has a Jetpack user connection.
	 *
	 * @return bool
	 */
	public function is_user_connected() {
		return ( new Manager( 'jetpack' ) )->is_user_connected();
	}

	/**
	 * Send a request to WordPress.com.
	 *
	 * Logged-in requests use the current Jetpack-connected user. Logged-out
	 * requests are sent directly to the public WordPress.com API.
	 *
	 * @param string            $path          REST API path.
	 * @param string            $version       REST API version.
	 * @param array             $args          Arguments passed to WP_Http.
	 * @param array|string|null $body          Request body.
	 * @param string            $base_api_path REST API root.
	 *
	 * @return array|\WP_Error Response data, or WP_Error on failure.
	 */
	public function request(
		$path,
		$version = '2',
		$args = array(),
		$body = null,
		$base_api_path = 'wpcom'
	) {
		if ( is_user_logged_in() ) {
			return Client::wpcom_json_api_request_as_user( $path, $version, $args, $body, $base_api_path );
		}

		$request_args = Client::validate_args_for_wpcom_json_api_request( $path, $version, $args, $base_api_path );
		$url          = $request_args['url'];
		unset( $request_args['url'] );

		if ( isset( $body ) && ! isset( $request_args['headers'] ) && in_array( $request_args['method'], array( 'POST', 'PUT', 'PATCH' ), true ) ) {
			$request_args['headers'] = array( 'Content-Type' => 'application/json' );
		}

		if ( isset( $body ) && ! is_string( $body ) ) {
			$body = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );
		}

		if ( isset( $body ) ) {
			$request_args['body'] = $body;
		}

		return wp_remote_request( $url, $request_args );
	}
}
