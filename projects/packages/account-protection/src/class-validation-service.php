<?php
/**
 * Class used to define Validation Service.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Class Validation_Service
 */
class Validation_Service {
	/**
	 * Check if the password is in the list of common/compromised passwords.
	 *
	 * @param string $password The password to check.
	 * @return bool|\WP_Error True if the password is in the list of common/compromised passwords, false otherwise.
	 */
	public function check_weak_passwords( string $password ) {
		$api_url = '/jetpack-protect-weak-password';

		$is_connected = ( new Connection_Manager() )->is_connected();
		if ( ! $is_connected ) {
			return new \WP_Error( 'site_not_connected' );
		}

		$hashed_password = sha1( $password );
		$password_prefix = substr( $hashed_password, 0, 5 );

		$response = Client::wpcom_json_api_request_as_blog(
			$api_url . '/' . $password_prefix,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return false;
			// TODO: Return or log error?
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		$password_suffix = substr( $hashed_password, 5 );
		if ( in_array( $password_suffix, $body['compromised'] ?? array(), true ) ) {
			return true;
		}

		if ( in_array( $password_suffix, $body['common'] ?? array(), true ) ) {
			return true;
		}

		return false;
	}
}
