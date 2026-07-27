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
 * Sends authenticated WP.com requests through Jetpack Connection.
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
	 * Send a request authenticated as the current Jetpack-connected user.
	 *
	 * @param string            $path          REST API path.
	 * @param string            $version       REST API version.
	 * @param array             $args          Arguments passed to WP_Http.
	 * @param array|string|null $body          Request body.
	 * @param string            $base_api_path REST API root.
	 *
	 * @return array|\WP_Error Response data, or WP_Error on failure.
	 */
	public function request_as_user(
		$path,
		$version = '2',
		$args = array(),
		$body = null,
		$base_api_path = 'wpcom'
	) {
		return Client::wpcom_json_api_request_as_user( $path, $version, $args, $body, $base_api_path );
	}
}
