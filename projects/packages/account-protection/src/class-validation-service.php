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
	 * Validation rules.
	 *
	 * @var array
	 */
	private $rules = array(
		Min_Length_Rule::class,
		Not_Empty_Rule::class,
		No_Backslash_Rule::class,
		Not_Recent_Rule::class,
		Not_Compromised_Rule::class,
		No_Userdata_Rule::class,
	);

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
	 * Get the validation errors.
	 *
	 * @param string $password The password to check.
	 * @param array  $userdata The user data to check against, or null if not provided.
	 *
	 * @return string[] List of broken rule IDs.
	 */
	public function get_validation_errors( string $password, array $userdata = null ) {
		$broken_rules = array();

		foreach ( $this->rules as $rule ) {
			$rule = new $rule( $this );

			// Get the number of parameters the callback accepts;
			$param_names = array_map(
				function ( $param ) {
					return $param->getName();
				},
				( new \ReflectionMethod( $rule, 'callback' ) )->getParameters()
			);

			// Assemble the arguments required by the callback.
			$args = array( $password );
			if ( in_array( 'userdata', $param_names, true ) ) {
				$args[] = $userdata;
			}

			// Call the callback.
			$validation_callback_result = call_user_func_array( array( $rule, 'callback' ), $args );

			if ( ! $validation_callback_result ) {
				$broken_rules[] = $rule->id;
			}
		}

		return $broken_rules;
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
	 * @param string $password The password to check.
	 * @param array  $userdata The user data.
	 *
	 * @return bool True if the password matches any user data, false otherwise.
	 */
	public function matches_user_data( string $password, array $userdata ): bool {
		$data_to_match = array(
			$userdata['user_login'] ?? '',
			$userdata['display_name'] ?? '',
			$userdata['first_name'] ?? '',
			$userdata['last_name'] ?? '',
			$userdata['user_email'] ?? '',
			$userdata['nickname'] ?? '',
		);

		if ( $userdata['user_email'] ) {
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

	/**
	 * Check if the password is in the list of compromised/common passwords.
	 *
	 * @param string $password The password to check.
	 *
	 * @return bool True if the password is in the list of compromised/common passwords, false otherwise.
	 */
	public function is_compromised_password( string $password ): bool {
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
	 * @param string $password The password to check.
	 * @param array  $userdata The user data.
	 *
	 * @return bool True if the password was recently used, false otherwise.
	 */
	public function is_recent_password( string $password, array $userdata ): bool {
		if ( ! array_key_exists( 'ID', $userdata ) ) {
			return false;
		}

		if ( $this->is_current_password( $userdata['ID'], $password ) ) {
			return true;
		}

		$recent_passwords = get_user_meta( $userdata['ID'], Config::PASSWORD_MANAGER_RECENT_PASSWORD_HASHES_USER_META_KEY, true );
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
