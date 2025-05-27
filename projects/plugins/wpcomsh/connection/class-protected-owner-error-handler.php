<?php
/**
 * The Jetpack Connection Protected Owner Error Handler class file.
 *
 * @package wpcomsh
 */

namespace Automattic\WPComSH\Connection;

/**
 * The Jetpack Connection Protected Owner Error Handler class.
 *
 * This class handles errors related to protected owner accounts in the Jetpack Connection.
 * It retrieves owner account errors stored in WordPress options and displays them in the UI.
 *
 * The class automatically clears errors when the required local account is created,
 * allowing external healing code to establish the proper Jetpack connection.
 */
class Protected_Owner_Error_Handler {

	/**
	 * The name of the option that stores the error
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_protected_owner_error';

	/**
	 * Holds the instance of this singleton class
	 *
	 * @var Protected_Owner_Error_Handler $instance
	 */
	private static $instance = null;

	/**
	 * Initialize instance and register hooks
	 */
	private function __construct() {
		// Inject protected owner errors into the connection error system
		add_filter( 'jetpack_connection_get_verified_errors', array( $this, 'handle_error' ) );

		// Add React dashboard integration for protected owner errors
		add_filter( 'react_connection_errors_initial_state', array( $this, 'add_to_react_dashboard' ) );

		// Clear errors on reconnection or token updates
		add_action( 'jetpack_site_registered', array( $this, 'delete_error' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_error' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_error' ) );

		// Clear errors when the missing user is created or updated (allows external healing code to work)
		add_action( 'user_register', array( $this, 'check_and_clear_error_for_user' ) );
		add_action( 'profile_update', array( $this, 'check_and_clear_error_for_user' ) );
	}

	/**
	 * Gets the instance of this singleton class
	 *
	 * @return Protected_Owner_Error_Handler $instance
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Check if there's an active protected owner error
	 *
	 * @return array|false Raw error data if there's an active error, false otherwise.
	 */
	private function get_active_error() {
		// Check if option is populated
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) ) {
			return false;
		}

		// Validate the minimal required fields
		if ( ! isset( $raw_error['error_type'] ) || ! isset( $raw_error['email'] ) ) {
			return false;
		}

		// Check if user exists with the required email
		$user = get_user_by( 'email', $raw_error['email'] );
		if ( $user ) {
			// User exists, delete the option and return false (no active error)
			$this->delete_error();
			return false;
		}

		// User doesn't exist, we have an active error
		return $raw_error;
	}

	/**
	 * Handle protected owner errors in the connection error system
	 *
	 * @param array $verified_errors Current verified errors.
	 * @return array Updated verified errors including protected owner errors.
	 */
	public function handle_error( $verified_errors ) {
		$raw_error = $this->get_active_error();

		// Return early if no active error
		if ( ! $raw_error ) {
			return $verified_errors;
		}

		// Use a consistent error code for all protected owner errors
		$error_code = 'protected_owner_missing';

		// Prepare error data for the connection error system
		$user_id   = $raw_error['protected_owner_local_id'] ?? '0';
		$timestamp = $raw_error['timestamp'] ?? time();

		$error_details = array(
			'error_code'    => $error_code,
			'user_id'       => $user_id,
			'error_message' => $this->get_error_message( $raw_error['email'] ),
			'error_data'    => array(
				'email'      => $raw_error['email'],
				'error_type' => $raw_error['error_type'],
			),
			'timestamp'     => $timestamp,
			'nonce'         => wp_generate_password( 10, false ),
			'error_type'    => 'protected_owner',
		);

		// Return only the protected owner error - it takes priority over other connection errors
		// since it's typically the root cause and other errors may be symptoms
		return array(
			$error_code => array(
				$user_id => $error_details,
			),
		);
	}

	/**
	 * Get a user-friendly error message for protected owner errors
	 *
	 * @param string $email The WordPress.com email address of the protected owner.
	 * @return string The error message.
	 */
	private function get_error_message( $email ) {
		return sprintf(
			// translators: %s is the WordPress.com email address
			__( 'This site needs to be connected to WordPress.com by the plan owner account with email %s. Please create the missing account to resolve this issue.', 'wpcomsh' ),
			esc_html( $email )
		);
	}

	/**
	 * Add protected owner error to React dashboard
	 *
	 * @param array $errors Current errors for React dashboard.
	 * @return array Updated errors including protected owner error.
	 */
	public function add_to_react_dashboard( $errors ) {
		$raw_error = $this->get_active_error();

		// Return early if no active error
		if ( ! $raw_error ) {
			return $errors;
		}

		// Ensure errors is an array
		$errors = is_array( $errors ) ? $errors : array();

		// Add the protected owner error
		$errors[] = array(
			'code'         => 'protected_owner_missing',
			'message'      => $this->get_error_message( $raw_error['email'] ),
			'action'       => 'protected_owner_action',
			'action_links' => array(
				array(
					'title'     => __( 'Create missing account', 'wpcomsh' ),
					'action'    => 'create_missing_account',
					'errorCode' => 'protected_owner_missing',
					'errorData' => array(
						'email'      => $raw_error['email'],
						'error_type' => $raw_error['error_type'],
					),
					'variant'   => 'primary',
				),
			),
			'can_be_fixed' => true,
		);

		return $errors;
	}

	/**
	 * Delete the stored error
	 */
	public function delete_error() {
		delete_option( self::STORED_ERRORS_OPTION );

		// Also clear our error from Jetpack's verified errors since we injected it there
		$this->clear_from_verified_errors();
	}

	/**
	 * Clear protected owner errors from Jetpack's verified errors
	 */
	private function clear_from_verified_errors() {
		$verified_errors = get_option( 'jetpack_connection_xmlrpc_verified_errors', array() );

		if ( ! is_array( $verified_errors ) ) {
			return;
		}

		// Remove our error code from verified errors
		if ( isset( $verified_errors['protected_owner_missing'] ) ) {
			unset( $verified_errors['protected_owner_missing'] );

			// Update the option with our error removed
			if ( empty( $verified_errors ) ) {
				delete_option( 'jetpack_connection_xmlrpc_verified_errors' );
			} else {
				update_option( 'jetpack_connection_xmlrpc_verified_errors', $verified_errors );
			}
		}
	}

	/**
	 * Delete the error and return the unfiltered value
	 * Used for filter callbacks where we need to maintain the original return value
	 *
	 * @param mixed $value The value passed to the filter.
	 * @return mixed The unfiltered value.
	 */
	public function delete_error_and_return_unfiltered_value( $value ) {
		$this->delete_error();
		return $value;
	}

	/**
	 * Check if the user matches the protected owner error and clear it if so
	 * This allows external healing code to automatically establish the connection
	 *
	 * @param int $user_id The ID of the user to check.
	 */
	public function check_and_clear_error_for_user( $user_id ) {
		// Get the raw error data to check the email
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) || ! isset( $raw_error['email'] ) ) {
			return;
		}

		// Get the user
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return;
		}

		// Check if the user's email matches the required email
		if ( strtolower( $user->user_email ) === strtolower( $raw_error['email'] ) ) {
			// The user with the required email has been created/updated
			// Clear the error so external healing code can establish the connection
			$this->delete_error();
		}
	}
}
