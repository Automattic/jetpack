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
	 * Return validation initial state.
	 *
	 * @param bool $user_specific Whether or not to include user specific checks.
	 *
	 * @return array An array of all validation statuses and messages.
	 */
	public function get_validation_initial_state( $user_specific ): array {
		$base_conditions = array(
			'core'               => array(
				'status'  => null,
				'message' => __( 'Strong password', 'jetpack-account-protection' ),
				'info'    => __( 'Passwords should meet WordPress core security requirements to enhance account protection.', 'jetpack-account-protection' ),
			),
			'contains_backslash' => array(
				'status'  => null,
				'message' => __( "Doesn't contain a backslash (\\) character", 'jetpack-account-protection' ),
				'info'    => null,
			),
			'invalid_length'     => array(
				'status'  => null,
				'message' => __( 'Between 6 and 150 characters', 'jetpack-account-protection' ),
				'info'    => null,
			),
			'leaked'             => array(
				'status'  => null,
				'message' => __( 'Not a leaked password', 'jetpack-account-protection' ),
				'info'    => __( 'If found in a public breach, this password may already be known to attackers.', 'jetpack-account-protection' ),
			),
		);

		if ( ! $user_specific ) {
			return $base_conditions;
		}

		$user_specific_conditions = array(
			'matches_user_data' => array(
				'status'  => null,
				'message' => __( "Doesn't match existing user data", 'jetpack-account-protection' ),
				'info'    => __( 'Using a password similar to your username or email makes it easier to guess.', 'jetpack-account-protection' ),
			),
			'recent'            => array(
				'status'  => null,
				'message' => __( 'Not used recently', 'jetpack-account-protection' ),
				'info'    => __( 'Reusing old passwords may increase security risks. A fresh password improves protection.', 'jetpack-account-protection' ),
			),
		);

		return array_merge( $base_conditions, $user_specific_conditions );
	}

	/**
	 * Return validation state - client-side.
	 *
	 * @param string $password The password to check.
	 * @param bool   $user_specific Whether or not to run user specific checks.
	 *
	 * @return array An array of the status of each check.
	 */
	public function get_validation_state( string $password, $user_specific ): array {
		$validation_state = $this->get_validation_initial_state( $user_specific );

		$validation_state['contains_backslash']['status'] = $this->contains_backslash( $password );
		$validation_state['invalid_length']['status']     = $this->is_invalid_length( $password );
		$validation_state['leaked']['status']             = $this->is_leaked_password( $password );

		if ( ! $user_specific ) {
			return $validation_state;
		}

		// Run checks on existing user data
		$user = wp_get_current_user();
		$validation_state['matches_user_data']['status'] = $this->matches_user_data( $user, $password );
		$validation_state['recent']['status']            = $this->is_recent_password_hash( $user, $password );

		return $validation_state;
	}

	/**
	 * Return all validation errors - server-side.
	 *
	 * @param string         $password The password to check.
	 * @param bool           $user_specific Whether or not to run user specific checks.
	 * @param \stdClass|null $user The user data or null.
	 *
	 * @return array The validation errors (if any).
	 */
	public function get_validation_errors( string $password, $user_specific = false, $user = null ): array {
		$errors = array();

		if ( empty( $password ) ) {
			$errors[] = __( '<strong>Error:</strong> The password cannot be a space or all spaces.', 'jetpack-account-protection' );
		}

		if ( $this->contains_backslash( $password ) ) {
			$errors[] = __( '<strong>Error:</strong> Passwords may not contain the character "\\".', 'jetpack-account-protection' );
		}

		if ( $this->is_invalid_length( $password ) ) {
			$errors[] = __( '<strong>Error:</strong> The password must be between 6 and 150 characters.', 'jetpack-account-protection' );
		}

		if ( $this->is_leaked_password( $password ) ) {
			$errors[] = __( '<strong>Error:</strong> The password was found in a public leak.', 'jetpack-account-protection' );
		}

		// Skip user-specific checks during password reset
		if ( $user_specific ) {
			// Run checks on new user data
			if ( $this->matches_user_data( $user, $password ) ) {
				$errors[] = __( '<strong>Error:</strong> The password matches new user data.', 'jetpack-account-protection' );
			}
			if ( $this->is_recent_password_hash( $user, $password ) ) {
				$errors[] = __( '<strong>Error:</strong> The password was used recently.', 'jetpack-account-protection' );
			}
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
		return $length < Config::VALIDATION_SERVICE_MIN_LENGTH || $length > Config::VALIDATION_SERVICE_MAX_LENGTH;
	}

	/**
	 * Check if the password matches any user data.
	 *
	 * @param \WP_User|\stdClass|null $user The user.
	 * @param string                  $password The password to check.
	 *
	 * @return bool True if the password matches any user data, false otherwise.
	 */
	public function matches_user_data( $user, string $password ): bool {
		if ( ! $user ) {
			return false;
		}

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
	public function is_leaked_password( string $password ): bool {
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
	 * @param int    $user_id  The user ID.
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is the current password, false otherwise.
	 */
	public function is_current_password( int $user_id, string $password ): bool {
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return false;
		}

		return wp_check_password( $password, $user->user_pass, $user->ID );
	}

	/**
	 * Check if the password has been used recently by the user.
	 *
	 * @param \WP_User|\stdClass $user The user data.
	 * @param string             $password The password to check.
	 *
	 * @return bool True if the password was recently used, false otherwise.
	 */
	public function is_recent_password_hash( $user, string $password ): bool {
		// Skip on user creation
		if ( empty( $user->ID ) ) {
			return false;
		}

		$user_data = $user instanceof \WP_User ? $user : get_userdata( $user->ID );
		if ( $this->is_current_password( $user_data->ID, $password ) ) {
			return true;
		}

		$recent_passwords = get_user_meta( $user->ID, Config::RECENT_PASSWORD_HASHES_USER_META_KEY, true );
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
