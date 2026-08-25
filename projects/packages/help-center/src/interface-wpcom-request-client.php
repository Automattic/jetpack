<?php
/**
 * WP.com request client interface.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Sends requests to the WordPress.com API.
 */
interface Wpcom_Request_Client {
	/**
	 * Whether the current user can make authenticated WordPress.com requests.
	 *
	 * @return bool
	 */
	public function is_user_connected();

	/**
	 * Send a request to WordPress.com.
	 *
	 * Implementations should authenticate the request as the current user when
	 * possible and send it anonymously when the user is logged out.
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
	);
}
