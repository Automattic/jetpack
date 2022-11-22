<?php
/**
 * Class to handle Rewind
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;

/**
 * Class that handles the rewind api call.
 */
class Credentials {
	/**
	 * Get the rewind state, if no creds are set the state will be 'awaiting_for_credentials'
	 *
	 * @return bool
	 */
	public static function get_credential_array() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return false;
		}

		$api_url = sprintf( '/sites/%d/scan', $blog_id );

		$response = Client::wpcom_json_api_request_as_blog(
			$api_url,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code ) {
			return false;
		}

		$parsed_response = json_decode( $response['body'] );

		if ( ! $parsed_response ) {
			return false;
		}

		return isset( $parsed_response->credentials ) ? $parsed_response->credentials : array();
	}

}
