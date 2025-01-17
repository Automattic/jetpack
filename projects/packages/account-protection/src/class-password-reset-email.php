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
	public static function mask_email_address( $email ) {
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
	 * @param WP_User $user The user object.
	 * @return bool True if the email was sent successfully, false otherwise.
	 */
	public static function send( $user ) {
		// $site_url    = home_url();
		// $parsed_url  = wp_parse_url( $site_url );
		// $domain_name = $parsed_url['host'];
		// $username    = $user->user_login;
		// $email       = $user->user_email;

		// $key                 = get_password_reset_key( $user );
		// $locale              = get_user_locale( $user );
		// $password_reset_link = network_site_url( 'wp-login.php?login=' . rawurlencode( $username ) . "&key=$key&action=rp", 'login' ) . '&wp_lang=' . $locale;

		// TODO: Update to use custom email method when available, passing $domain_name, $email, $username, and $password_reset_link
		return $user ? true : false;
	}
}
