<?php
/**
 * Class used to define Password Reset Email.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Password_Reset_Email
 */
class Password_Reset_Email {

	/**
	 * Mask an email address like d*****@g*****.com.
	 *
	 * @param string $email The email address to mask.
	 * @return string The masked email address.
	 */
	public function mask_email_address( string $email ): string {
		$parts  = explode( '@', $email );
		$name   = $parts[0];
		$domain = $parts[1];

		// Mask the name part (first letter + asterisks)
		$masked_name = substr( $name, 0, 1 ) . str_repeat( '*', strlen( $name ) - 1 );

		// Mask the domain part (first letter + asterisks + domain extension)
		$domain_parts  = explode( '.', $domain );
		$masked_domain = substr( $domain_parts[0], 0, 1 ) . str_repeat( '*', strlen( $domain_parts[0] ) - 1 ) . '.' . $domain_parts[1];

		return $masked_name . '@' . $masked_domain;
	}

	/**
	 * Send password reset email.
	 *
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public function send(): bool {
		// TODO: Update to use custom email method when available
		return true;
	}
}
