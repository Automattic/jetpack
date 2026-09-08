<?php
/**
 * Expiry_Wpcom_Request: a WordPress.com read the site makes as itself.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Client;

/**
 * The one way the expiry notices ask WordPress.com for anything from Atomic.
 */
class Expiry_Wpcom_Request {

	/**
	 * GET a REST v1.x path with the site's blog token, decoded, or null on any failure.
	 *
	 * Only the endpoints that accept a blog token are answerable from Atomic at
	 * all; each caller names one that does.
	 *
	 * @param string $path    Path under the REST base, with any query string.
	 * @param string $version API version.
	 * @return mixed Decoded JSON body, or null.
	 */
	public static function get_as_blog( string $path, string $version = '1.2' ) {
		if ( ! class_exists( '\Jetpack_Options' ) || ! class_exists( Client::class ) ) {
			return null;
		}

		if ( ! \Jetpack_Options::get_option( 'id' ) ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			$path,
			$version,
			array(
				'method'  => 'GET',
				// This runs during a page load, so a slow answer must not become
				// a slow page. Failing here only costs what the caller was asking.
				'timeout' => 5,
			),
			null,
			'rest'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		return json_decode( wp_remote_retrieve_body( $response ) );
	}
}
