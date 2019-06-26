<?php
/**
 * Jetpack Client
 *
 * Deprecated methods for Jetpack to act as client with wpcom, provided for back-compatibility.
 *
 * @category   Connection
 * @package    Client
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class Jetpack_Client
 *
 * @deprecated Use Automattic\Jetpack\Connection\Client
 */
class Jetpack_Client {

	/**
	 * Perform remote request.
	 *
	 * @deprecated use Automattic\Jetpack\Connection\Client::remote_request
	 *
	 * @param array $args Arguments.
	 * @param null  $body Request body.
	 *
	 * @return array|WP_Error
	 */
	public static function remote_request( $args, $body = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Connection\Client' );
		return Client::remote_request( $args, $body );
	}

	/**
	 * Request to wpcom using the blog id.
	 *
	 * @deprecated use Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog
	 *
	 * @param string $path Endpoint path.
	 * @param string $version Endpoint version.
	 * @param array  $args Arguments.
	 * @param null   $body Request body.
	 * @param string $base_api_path Endpoint base prefix.
	 *
	 * @return Array|WP_Error
	 */
	public static function wpcom_json_api_request_as_blog( $path, $version, $args, $body, $base_api_path ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Connection\Client' );
		return Client::wpcom_json_api_request_as_blog( $path, $version, $args, $body, $base_api_path );
	}
}
