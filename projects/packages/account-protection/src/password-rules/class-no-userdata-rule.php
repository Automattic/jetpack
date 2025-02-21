<?php
/**
 * No Userdata Rule
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * No Userdata Rule
 *
 * This rule checks if the password contains any user data.
 */
class No_Userdata_Rule extends Password_Rule {
	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id = 'no_userdata';

	/**
	 * Get the label of the rule.
	 *
	 * @return string The label of the rule.
	 */
	public function get_label(): string {
		return __( 'Doesn\'t match existing user data', 'jetpack-account-protection' );
	}

	/**
	 * Get the description of the rule.
	 *
	 * @return string The description of the rule.
	 */
	public function get_description(): string {
		return __( 'Using a password similar to your username or email makes it easier to guess.', 'jetpack-account-protection' );
	}

	/**
	 * Get the error message of the rule.
	 *
	 * @return string The error message of the rule.
	 */
	public function get_error(): string {
		return __( '<strong>Error:</strong> The password matches existing user data.', 'jetpack-account-protection' );
	}

	/**
	 * Check if the password matches any user data.
	 *
	 * @param string $password The password to check.
	 * @param array  $userdata The user data.
	 *
	 * @return bool True if the password matches any user data, false otherwise.
	 */
	public function callback( string $password, ?array $userdata = null ): bool {
		if ( empty( $userdata ) ) {
			return false;
		}

		$data_to_match = array(
			$userdata['user_login'] ?? '',
			$userdata['display_name'] ?? '',
			$userdata['first_name'] ?? '',
			$userdata['last_name'] ?? '',
			$userdata['user_email'] ?? '',
			$userdata['nickname'] ?? '',
		);

		if ( ! empty( $userdata['user_email'] ) ) {
			$email_parts    = explode( '@', $userdata['user_email'] ); // test@example.com
			$email_username = $email_parts[0]; // 'test'
			$email_domain   = $email_parts[1]; // 'example.com'
			$email_provider = explode( '.', $email_domain )[0]; // 'example'

			$data_to_match[] = $email_username;
			$data_to_match[] = $email_provider;
		}

		foreach ( $data_to_match as $data ) {
			if ( strlen( $data ) <= 3 ) {
				continue;
			}

			if ( strpos( strtolower( $password ), strtolower( $data ) ) !== false ) {
				return true;
			}
		}

		return false;
	}
}
