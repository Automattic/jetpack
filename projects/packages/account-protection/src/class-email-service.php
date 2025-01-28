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
	 * Send auth email.
	 *
	 * @param WP_User $user The user.
	 * @param string  $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public function send_auth_email( $user, $auth_code ): bool {
		$wp_send = $this->wp_send_auth_email( $user, $auth_code );

		if ( ! $wp_send ) {
			$api_send = $this->api_send_auth_email( $user, $auth_code );

			return $api_send;
		}

		return true;
	}

	/**
	 * Send the email using wp_mail().
	 *
	 * @param WP_User $user The user.
	 * @param string  $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	private function wp_send_auth_email( $user, $auth_code ) {
		$blog_name = esc_html( get_bloginfo( 'name' ) );
		$user_url  = ! empty( $user->user_url ) ? esc_url( $user->user_url ) : esc_url( home_url() );

		$subject = 'Verify your identity at Jetpack';
		$message = sprintf(
			'
			<p>Hi %s,</p>
			<p>Your current password for <a href="%s">%s</a> was found in a public leak, which means your account might be at risk.</p>
			<p>To help protect your account, please enter this code at the login prompt:</p>
			<p><strong>%s</strong></p>
			<p>If you didn\'t just log into %s, please do so now and change your password.</p>
			<p>Stay secure,<br>Jetpack</p>
			',
			esc_html( $user->user_login ),
			$user_url,
			$blog_name,
			esc_html( $auth_code ),
			$user_url,
			$blog_name
		);

		$headers = array( 'Content-Type: text/html; charset=UTF-8' );

		return wp_mail( $user->user_email, $subject, $message, $headers );
	}

	/**
	 * Send the email using the API.
	 *
	 * @param WP_User $user The user.
	 * @param string  $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	private function api_send_auth_email( $user, $auth_code ) {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$is_connected = ( new Connection_Manager() )->is_connected();

		if ( ! $blog_id || ! $is_connected ) {
			return false;
		}

		$body = array(
			'user_login' => $user->user_login,
			'user_email' => $user->user_email,
			'code'       => $auth_code,
		);

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-protect-send-verification-code', $blog_id ),
			'2',
			array(
				'method' => 'POST',
			),
			$body,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		return $body['success'] ?? false;
	}

	/**
	 * Resend email attempts.
	 *
	 * @param WP_User $user The user.
	 * @param array   $transient_data The transient data.
	 * @param string  $token The token.
	 * @return bool True if the email was resent successfully, false otherwise.
	 */
	public function resend_auth_email( $user, $transient_data, $token ): bool {
		if ( $transient_data['resend_attempts'] >= Config::MAX_RESEND_ATTEMPTS ) {
			return false;
		}

		$auth_code                   = $this->generate_auth_code();
		$transient_data['auth_code'] = $auth_code;
		++$transient_data['resend_attempts'];

		if ( ! set_transient( Config::TRANSIENT_PREFIX . "_{$token}", $transient_data, Config::EMAIL_SENT_EXPIRATION ) ) {
			return false;
		}

		if ( ! $this->send_auth_email( $user, $auth_code ) ) {
			return false;
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
	 * @return string The masked email address.
	 */
	public function mask_email_address( string $email ): string {
		$parts        = explode( '@', $email );
		$name         = substr( $parts[0], 0, 1 ) . str_repeat( '*', strlen( $parts[0] ) - 1 );
		$domain_parts = explode( '.', $parts[1] );
		$domain       = substr( $domain_parts[0], 0, 1 ) . str_repeat( '*', strlen( $domain_parts[0] ) - 1 );

		return "{$name}@{$domain}.{$domain_parts[1]}";
	}
}
