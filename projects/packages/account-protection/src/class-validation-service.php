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
	 * Return all validation errors.
	 *
	 * @param \WP_User $user The user object or a copy.
	 * @param string   $password The password to check.
	 *
	 * @return array An array of validation errors (if any).
	 */
	public function return_all_validation_errors( \WP_User $user, string $password ): array {
		$errors = array();

		if ( $this->contains_backslash( $password ) ) {
			$errors[] = __( 'Doesn\'t contain a backslash (\\) character', 'jetpack-account-protection' );
		}

		if ( $this->is_invalid_length( $password ) ) {
			$errors[] = __( 'Between 6 and 150 characters', 'jetpack-account-protection' );
		}

		if ( $this->matches_user_data( $user, $password ) ) {
			$errors[] = __( 'Doesn\'t match user data', 'jetpack-account-protection' );
		}

		if ( $this->is_recent_password( $user->ID, $password ) ) {
			$errors[] = __( 'Not used recently', 'jetpack-account-protection' );
		}

		if ( $this->is_weak_password( $password ) ) {
			$errors[] = __( 'Not a leaked password.', 'jetpack-account-protection' );
		}

		return $errors;
	}

	/**
	 * Return first validation error.
	 *
	 * @param \WP_User                       $user     The user data.
	 * @param string                         $password The password to check.
	 * @param 'create-user'|'update'|'reset' $context  The context the validation is run in.
	 *
	 * @return string The first validation errors (if any).
	 */
	public function return_first_validation_error( \WP_User $user, string $password, $context ): string {
		// Reset form includes this validation in core
		if ( 'reset' !== $context ) {
			if ( empty( $password ) ) {
				return __( '<strong>Error:</strong> The password cannot be a space or all spaces.', 'jetpack-account-protection' );
			}
		}

		// Update and create-user forms include this validation in core
		if ( 'reset' === $context ) {
			if ( $this->contains_backslash( $password ) ) {
				return __( '<strong>Error:</strong> The password cannot contain a backslash (\\) character.', 'jetpack-account-protection' );
			}
		}

		if ( $this->is_invalid_length( $password ) ) {
			return __( '<strong>Error:</strong> The password must be between 6 and 150 characters.', 'jetpack-account-protection' );
		}

		if ( $this->matches_user_data( $user, $password ) ) {
			return __( '<strong>Error:</strong> The password matches user data.', 'jetpack-account-protection' );
		}

		if ( 'create-user' !== $context ) {
			if ( $this->is_recent_password( $user->ID, $password ) ) {
				return __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' );
			}
		}

		if ( $this->is_weak_password( $password ) ) {
			return __( '<strong>Error:</strong> The password was found in a public leak.', 'jetpack-account-protection' );
		}

		return '';
	}

	/**
	 * Check if the password contains a backslash.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password contains a backslash, false otherwise.
	 */
	public function contains_backslash( string $password ): bool {
		return strpos( $password, '\\' ) !== false;
	}

	/**
	 * Check if the password length is within the allowed range.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is between 6 and 150 characters, false otherwise.
	 */
	public function is_invalid_length( string $password ): bool {
		$length = strlen( $password );
		return $length < 6 || $length > 150;
	}

	/**
	 * Check if the password matches any user data.
	 *
	 * @param \WP_User $user     The user.
	 * @param string   $password The password to check.
	 *
	 * @return bool True if the password matches any user data, false otherwise.
	 */
	public function matches_user_data( \WP_User $user, string $password ): bool {
		$email_parts    = explode( '@', $user->user_email ); // test@example.com
		$email_username = $email_parts[0]; // 'test'
		$email_domain   = $email_parts[1]; // 'example.com'
		$email_provider = explode( '.', $email_domain )[0]; // 'example'

		$user_data = array(
			$user->user_login ?? '',
			$user->display_name ?? '',
			$user->first_name ?? '',
			$user->last_name ?? '',
			$user->user_email ?? '',
			$email_username ?? '',
			$email_provider ?? '',
			$user->nickname ?? '',
		);

		$password_lower = strtolower( $password );

		foreach ( $user_data as $data ) {
			// Skip if $data is 3 characters or less.
			if ( strlen( $data ) <= 3 ) {
				continue;
			}

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

	/**
	 * Check if the password is the current password for the user.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is the current password, false otherwise.
	 */
	public function is_current_password( int $user_id, string $password ): bool {
		$user = get_userdata( $user_id );
		return wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Check if the password has been used recently by the user.
	 *
	 * @param int    $user_id The user ID.
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password hash was recently used, false otherwise.
	 */
	public function is_recent_password( int $user_id, string $password ): bool {
		$recent_passwords = get_user_meta( $user_id, Config::VALIDATION_SERVICE_RECENT_PASSWORD_HASHES_USER_META_KEY, true );

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
