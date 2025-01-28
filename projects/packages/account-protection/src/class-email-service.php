<?php
/**
 * Class used to define Email Service.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Email_Service
 */
class Email_Service {
	/**
	 * Send auth email.
	 *
	 * @param string $email The email address to send the email to.
	 * @param string $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public function send_auth_email( $email, $auth_code ): bool {
		// $wp_send = $this->wp_send_auth_email( $email, $auth_code );

		// if ( ! $wp_send ) {
		// $api_send = $this->api_send_auth_email( $email, $auth_code );
		// return $api_send;
		// }

		return false;
	}

	/**
	 * Send the email using wp_mail().
	 *
	 * @param string $email The email address to send the email to.
	 * @param string $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	private function wp_send_auth_email( $email, $auth_code ) {
		$subject = 'Your Authentication Code';
		$message = "Hello,\n\nWe detected a password issue with your account. To proceed, please use the following authentication code:\n\nAuth Code: $auth_code\n\nThis code is valid for 10 minutes.\n\nThank you,\nThe Team";
		$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

		return wp_mail( $email, $subject, $message, $headers );
	}

	/**
	 * Send the email using the API.
	 *
	 * @param string $email The email address to send the email to.
	 * @param string $auth_code The authentication code.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	private function api_send_auth_email( $email, $auth_code ) {
		// TODO: Hook up to API to send email
		return true;
	}

	/**
	 * Resend email attempts.
	 *
	 * @param string $email The email address to send the email to.
	 * @param array  $transient_data The transient data.
	 * @param string $token The token.
	 * @return bool True if the email was resent successfully, false otherwise.
	 */
	public function resend_auth_email( $email, $transient_data, $token ): bool {
		++$transient_data['resend_attempts'];

		if ( $transient_data['resend_attempts'] > Config::MAX_RESEND_ATTEMPTS ) {
			return false;
		}

		$auth_code                   = $this->generate_auth_code();
		$transient_data['auth_code'] = $auth_code;

		if ( ! set_transient( Config::TRANSIENT_PREFIX . "_{$token}", $transient_data, Config::EMAIL_SENT_EXPIRATION ) ) {
			return false;
		}

		if ( ! $this->send_auth_email( $email, $auth_code ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Generate an auth code.
	 *
	 * @return int The generated auth code.
	 */
	public function generate_auth_code(): int {
		return wp_rand( 100000, 999999 );
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
