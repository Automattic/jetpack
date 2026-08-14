<?php
/**
 * Class to check for account errors in the Jetpack Connection.
 *
 * @package automattic/jetpack-connection
 * @since 6.11.0
 */

namespace Automattic\Jetpack\Connection;

/**
 * Class User_Account_Status
 */
class User_Account_Status {
	/**
	 * Check for possible account errors between the local user and WPCOM account.
	 *
	 * @since 6.11.0
	 *
	 * @param string $current_user_email The email of the current WordPress user.
	 * @param string $wpcom_user_email The email of the connected WordPress.com account.
	 *
	 * @return array An array of possible account errors, empty if no errors.
	 */
	public function check_account_errors( $current_user_email, $wpcom_user_email ) {
		$errors = array();

		// Check for email mismatch error.
		$has_mismatch = $this->possible_account_mismatch( $current_user_email, $wpcom_user_email );
		if ( $has_mismatch ) {
			$errors['mismatch'] = array(
				'type'    => 'mismatch',
				'message' => __( 'Your WordPress.com email is also used by another user account. This won’t affect functionality but may cause confusion about which user account is connected.', 'jetpack-connection' ),
				'details' => array(
					'site_email'  => $current_user_email,
					'wpcom_email' => $wpcom_user_email,
				),
			);
		}

		/**
		 * Filters the account errors.
		 *
		 * @since 6.11.0
		 *
		 * @param array  $errors             The array of account errors.
		 * @param string $current_user_email The email of the current WordPress user.
		 * @param string $wpcom_user_email   The email of the connected WordPress.com account.
		 */
		return apply_filters( 'jetpack_connection_account_errors', $errors, $current_user_email, $wpcom_user_email );
	}

	/**
	 * Check if there is a possible account mismatch between the local user and WPCOM account.
	 *
	 * @since 6.11.0
	 *
	 * @param string $current_user_email The email of the current WordPress user.
	 * @param string $wpcom_user_email The email of the connected WordPress.com account.
	 *
	 * @return bool Whether there is a possible account mismatch.
	 */
	public function possible_account_mismatch( $current_user_email, $wpcom_user_email ) {
		if ( ! $wpcom_user_email ) {
			return false;
		}

		$normalized_wpcom_email = self::normalize_email( $wpcom_user_email );

		// WordPress.com preserves the casing an address was registered with, while WordPress
		// stores addresses lowercased, so the two can represent the same address. Compare them
		// case-insensitively, the same way the get_user_by() lookup below matches.
		if ( self::normalize_email( $current_user_email ) === $normalized_wpcom_email ) {
			return false;
		}

		// The result depends only on the WordPress.com address, so it is cached per address
		// rather than per user.
		$transient_key = 'jetpack_account_mismatch_' . md5( $normalized_wpcom_email );

		$cached_result = get_transient( $transient_key );

		if ( false !== $cached_result ) {
			return (bool) $cached_result;
		}

		// Check if there's a WordPress user with the WPCOM email .
		$wpcom_email_user = get_user_by( 'email', $wpcom_user_email );
		$mismatch_exists  = false !== $wpcom_email_user;

		// Store the result in a transient for 24 hours.
		set_transient( $transient_key, $mismatch_exists, DAY_IN_SECONDS );

		return $mismatch_exists;
	}

	/**
	 * Clears account mismatch transients for a user when they update their email or are deleted.
	 *
	 * @since 6.11.0
	 *
	 * @param string|int $user_id_or_email User ID or email address.
	 * @return void
	 */
	public function clean_account_mismatch_transients( $user_id_or_email ) {
		$email = null;

		if ( is_numeric( $user_id_or_email ) ) {
			$user = get_userdata( $user_id_or_email );
			if ( $user && isset( $user->user_email ) ) {
				$email = $user->user_email;
			}
		} else {
			$email = $user_id_or_email;
		}

		if ( ! $email || ! is_email( $email ) ) {
			return;
		}

		$transient_key = 'jetpack_account_mismatch_' . md5( self::normalize_email( $email ) );
		delete_transient( $transient_key );
	}

	/**
	 * Normalize an email address so that addresses differing only in case are treated as equal.
	 *
	 * @since 8.10.3
	 *
	 * @param string $email The email address to normalize.
	 *
	 * @return string The normalized email address.
	 */
	private static function normalize_email( $email ) {
		return strtolower( trim( (string) $email ) );
	}
}
