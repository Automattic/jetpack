<?php
/**
 * Class used to define Two Factor Auth Email.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Reset_Email
 */
class Two_Factor_Auth_Email {
	/**
	 * Send two factor auth email.
	 *
	 * @param int    $user_id The user ID to send the email to.
	 * @param string $email The email address to send the email to.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public function send( $user_id, $email ): bool {
		// Generate an auth code and store in a transient
		// TODO: Ensure we are clearing all relevant transients if we are setting this up new
		$auth_code = wp_rand( 100000, 999999 );
		set_transient( "password_detection_auth_code_$user_id", $auth_code, 10 * MINUTE_IN_SECONDS );

		// Attempt to send auth code via wp_mail()
		$subject = 'Your Authentication Code';
		$message = "Hello,\n\nWe detected a password issue with your account. To proceed, please use the following authentication code:\n\nAuth Code: $auth_code\n\nThis code is valid for 10 minutes.\n\nThank you,\nThe Team";

		// Email headers
		$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

		// Send the email using wp_mail()
		$wp_mail_sent = wp_mail( $email, $subject, $message, $headers );

		// TODO: If ! $wp_mail_sent attempt to use custom method to send the email

		return $wp_mail_sent;
	}
}
