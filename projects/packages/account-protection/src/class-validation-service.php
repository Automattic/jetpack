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
	 * Save the new password to the user's recent passwords list.
	 *
	 * @param int    $user_id  The user ID.
	 * @param string $password The password to store.
	 */
	public function save_recent_password( int $user_id, string $password ) {
		// TODO: Use a timestamp for last used password and remove old ones - beyond 1 year?
		$recent_passwords = get_user_meta( $user_id, 'jetpack_acccount_protection_recent_passwords', true );

		if ( ! is_array( $recent_passwords ) ) {
			$recent_passwords = array();
		}

		$hashed_password = wp_hash_password( $password );
		if ( in_array( $hashed_password, $recent_passwords, true ) ) {
			return;
		}

		// Add the new hashed password and keep only the last 5
		array_unshift( $recent_passwords, $hashed_password );
		$recent_passwords = array_slice( $recent_passwords, 0, 5 );

		update_user_meta( $user_id, 'recent_passwords', $recent_passwords );
	}

	/**
	 * Validate password against security conditions.
	 *
	 * @param string $password The password to check.
	 * @param int    $user_id  The user ID.
	 *
	 * @return array An array of validation errors (if any).
	 */
	public function validate_password( string $password, int $user_id ): array {
		$errors = array();

		if ( $this->contains_backslash( $password ) ) {
			$errors[] = __( 'Doesn\'t contain a backslash (\\) character', 'jetpack-account-protection' );
		}

		if ( ! $this->check_length( $password ) ) {
			$errors[] = __( 'Between 6 and 150 characters', 'jetpack-account-protection' );
		}

		if ( $this->check_weak_passwords( $password ) ) {
			$errors[] = __( 'Not a common password.', 'jetpack-account-protection' );
		}

		// TODO: Modify the method to return common or compromised.
		// if ( $this->check_weak_passwords( $password ) ) {
		// $errors[] = __( 'Not a leaked password.', 'jetpack-account-protection' );
		// }

		if ( $this->matches_user_data( $password, $user_id ) ) {
			$errors[] = __( 'Doesn\'t match user data', 'jetpack-account-protection' );
		}

		if ( $this->is_recent_password( $password, $user_id ) ) {
			$errors[] = __( 'Not used recently', 'jetpack-account-protection' );
		}

		return $errors;
	}

	/**
	 * Check if the password contains a backslash.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password contains a backslash, false otherwise.
	 */
	private function contains_backslash( string $password ): bool {
		return strpos( $password, '\\' ) !== false;
	}

	/**
	 * Check if the password length is within the allowed range.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is between 6 and 150 characters, false otherwise.
	 */
	private function check_length( string $password ): bool {
		$length = strlen( $password );
		return $length >= 6 && $length <= 150;
	}

	/**
	 * Check if the password matches any user data.
	 *
	 * @param string $password The password to check.
	 * @param int    $user_id  The user ID.
	 *
	 * @return bool True if the password matches any user data, false otherwise.
	 */
	private function matches_user_data( string $password, int $user_id ): bool {
		$user = get_userdata( $user_id );

		if ( ! $user ) {
			return false;
		}

		$user_data = array(
			$user->user_login,
			$user->user_nicename,
			$user->display_name,
			$user->first_name,
			$user->last_name,
			$user->user_email,
			explode( '@', $user->user_email )[0], // Email username
			$user->nickname,
		);

		$password_lower = strtolower( $password );

		foreach ( $user_data as $data ) {
			if ( ! empty( $data ) && strpos( $password_lower, strtolower( $data ) ) !== false ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if the password is in the list of compromised/common passwords.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is in the list of compromised/common passwords, false otherwise.
	 */
	public function check_weak_passwords( string $password ): bool {
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
			// TODO: Return false or log error?
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

	/**
	 * Check if the password has been used recently by the user.
	 *
	 * @param string $password The password to check.
	 * @param int    $user_id  The user ID.
	 *
	 * @return bool True if the password was recently used, false otherwise.
	 */
	private function is_recent_password( string $password, int $user_id ): bool {
		$recent_passwords = get_user_meta( $user_id, 'recent_passwords', true );

		if ( empty( $recent_passwords ) || ! is_array( $recent_passwords ) ) {
			return false;
		}

		foreach ( $recent_passwords as $old_hashed_password ) {
			if ( wp_check_password( $password, $old_hashed_password ) ) {
				return true;
			}
		}

		return false;
	}
}
