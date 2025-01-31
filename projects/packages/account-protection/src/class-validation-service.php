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
	 * Connection manager dependency.
	 *
	 * @var Connection_Manager
	 */
	private $connection_manager;

	/**
	 * Constructor for dependency injection.
	 *
	 * @param Connection_Manager|null $connection_manager Connection manager dependency.
	 */
	public function __construct(
		?Connection_Manager $connection_manager = null
	) {
		$this->connection_manager = $connection_manager ?? new Connection_Manager();
	}

	/**
	 * Dependency decoupling so we can test this class.
	 *
	 * @param string $password_prefix The password prefix to be checked.
	 * @return array|\WP_Error
	 */
	protected function request_suffixes( string $password_prefix ) {
		return Client::wpcom_json_api_request_as_blog(
			'/jetpack-protect-weak-password/' . $password_prefix,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);
	}

	/**
	 * Check if the password is in the list of compromised/common passwords.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is in the list of compromised/common passwords, false otherwise.
	 */
	public function is_weak_password( string $password ): bool {
		if ( ! $this->connection_manager->is_connected() ) {
			return false;
		}

		$hashed_password = sha1( $password );
		$password_prefix = substr( $hashed_password, 0, 5 );

		$response = $this->request_suffixes( $password_prefix );

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return false;
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
