<?php
/**
 * Class used to define Email Service.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;

/**
 * Class Email_Service
 */
class Email_Service {
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
	 * Send the email using the API.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $auth_code The authentication code.
	 *
	 * @return true|\WP_Error True if the email was sent successfully, \WP_Error otherwise.
	 */
	public function api_send_auth_email( int $user_id, string $auth_code ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		if ( ! $blog_id || ! $this->connection_manager->is_connected() ) {
			return new \WP_Error( 'jetpack_connection_error', __( 'Jetpack is not connected. Please connect and try again.', 'jetpack-account-protection' ) );
		}

		$body = array(
			'user_id' => $user_id,
			'code'    => $auth_code,
		);

		$response = $this->send_email_request( (int) $blog_id, $body );
		if ( is_wp_error( $response ) || empty( $response['body'] ) ) {
			return new \WP_Error( 'email_send_error', __( 'Failed to send authentication code. Please try again.', 'jetpack-account-protection' ) );
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$body          = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( 200 !== $response_code ) {
			return new \WP_Error( $body['code'] ?? 'email_send_error', $body['message'] ?? __( 'Failed to send authentication code. Please try again.', 'jetpack-account-protection' ) );
		}

		if ( empty( $body['email_send_success'] ) ) {
			return new \WP_Error( 'email_send_error', __( 'Failed to send authentication code. Please try again.', 'jetpack-account-protection' ) );
		}

		return true;
	}

	/**
	 * Dependency decoupling for the static call to the client.
	 *
	 * @param int   $blog_id Blog ID.
	 * @param array $body The request body.
	 * @return array|\WP_Error Response data or error.
	 */
	protected function send_email_request( int $blog_id, array $body ) {
		return Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-protect-send-verification-code', $blog_id ),
			'2',
			array(
				'method' => 'POST',
			),
			$body,
			'wpcom'
		);
	}

	/**
	 * Resend email attempts.
	 *
	 * @param int    $user_id The user ID.
	 * @param array  $transient_data The transient data.
	 * @param string $token The token.
	 *
	 * @return true|\WP_Error True if the email was resent successfully, \WP_Error otherwise.
	 */
	public function resend_auth_email( int $user_id, array $transient_data, string $token ) {
		if ( $transient_data['requests'] >= Config::PASSWORD_DETECTION_EMAIL_REQUEST_LIMIT ) {
			return new \WP_Error( 'email_request_limit_exceeded', __( 'Email request limit exceeded. Please try again later.', 'jetpack-account-protection' ) );
		}

		$auth_code                   = $this->generate_auth_code();
		$transient_data['auth_code'] = $auth_code;

		$resend = $this->api_send_auth_email( $user_id, $auth_code );
		if ( is_wp_error( $resend ) ) {
			return $resend;
		}

		++$transient_data['requests'];

		if ( ! set_transient( Config::PREFIX . "_{$token}", $transient_data, Config::PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION ) ) {
			return new \WP_Error( 'transient_set_error', __( 'Failed to set transient data. Please try again.', 'jetpack-account-protection' ) );
		}

		return true;
	}

	/**
	 * Generate an auth code.
	 *
	 * @return string The generated auth code.
	 */
	public function generate_auth_code(): string {
		return (string) wp_rand( 100000, 999999 );
	}

	/**
	 * Mask an email address like d*****@g*****.com.
	 *
	 * @param string $email The email address to mask.
	 *
	 * @return string The masked email address.
	 */
	public function mask_email_address( string $email ): string {
		$parts        = explode( '@', $email );
		$name         = substr( $parts[0], 0, 1 ) . str_repeat( '*', strlen( $parts[0] ) - 1 );
		$domain_parts = explode( '.', $parts[1] );
		$domain       = substr( $domain_parts[0], 0, 1 ) . str_repeat( '*', strlen( $domain_parts[0] ) - 1 );

		// Join all domain parts except the first one with dots
		$tld = implode( '.', array_slice( $domain_parts, 1 ) );

		return "{$name}@{$domain}.{$tld}";
	}
}
