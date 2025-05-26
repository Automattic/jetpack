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
		// Clear errors on reconnection or token updates
		add_action( 'jetpack_site_registered', array( $this, 'delete_error' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_error' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_error' ) );

		// Clear errors when the missing user is created or updated (allows external healing code to work)
		add_action( 'user_register', array( $this, 'check_and_clear_error_on_user_creation' ) );
		add_action( 'profile_update', array( $this, 'check_and_clear_error_on_user_update' ) );

		// Handle context-specific error integration
		add_action( 'admin_enqueue_scripts', array( $this, 'setup_context_specific_error_handling' ) );
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
	 * Get the stored error from the database and process it for My Jetpack (verified errors format)
	 *
	 * @return array|false The verified errors array or false if no error is stored or valid.
	 */
	public function get_error() {
		// Get the raw error data from the option
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) ) {
			return false;
		}

		// Validate the minimal required fields
		if ( ! isset( $raw_error['error_type'] ) || ! isset( $raw_error['email'] ) ) {
			return false;
		}

		// Get the master user (connection owner) ID
		$master_user_id = \Jetpack_Options::get_option( 'master_user' );
		$master_user    = $master_user_id ? get_user_by( 'id', $master_user_id ) : false;

		// Determine the error code based on error_type and current connection state
		$error_code = $this->determine_error_code( $raw_error, $master_user );

		// If error_code is false, no valid error condition exists
		if ( ! $error_code ) {
			$this->delete_error();
			return false;
		}

		// Prepare error data for My Jetpack (verified errors format)
		$user_id   = $raw_error['protected_owner_local_id'] ?? '0';
		$timestamp = $raw_error['timestamp'] ?? time();

		$error_details = array(
			'error_code'    => $error_code,
			'user_id'       => $user_id,
			'error_message' => $this->get_error_message( $error_code, $raw_error['email'] ),
			'error_data'    => array(
				'email'      => $raw_error['email'],
				'error_type' => $raw_error['error_type'],
			),
			'timestamp'     => $timestamp,
			'nonce'         => wp_generate_password( 10, false ),
			'error_type'    => 'protected_owner',
		);

		// Return in verified errors format for My Jetpack
		return array(
			$error_code => array(
				$user_id => $error_details,
			),
		);
	}

	/**
	 * Determine the error code based on the raw error data and current connection state
	 *
	 * @param array         $raw_error      The raw error data.
	 * @param \WP_User|bool $master_user The master user object or false if not exists.
	 * @return string|false The determined error code or false if no valid error.
	 */
	private function determine_error_code( $raw_error, $master_user ) {
		$error_type = $raw_error['error_type'];

		// Handle missing_owner error type
		if ( 'missing_owner' === $error_type ) {
			if ( $master_user ) {
				// Master user exists, so the protected owner is missing but someone is connected
				return 'wrong_owner_protected_owner_missing';
			} else {
				// No master user, completely missing connection owner
				return 'no_user_connection_protected_owner_missing';
			}
		}

		// Unrecognized error type
		return false;
	}

	/**
	 * Get a user-friendly error message based on the error type
	 *
	 * @param string $error_type The type of error.
	 * @param string $email The WordPress.com email address of the protected owner.
	 * @return string The error message.
	 */
	protected function get_error_message( $error_type, $email ) {
		// Use plain text for the email - frontend will handle styling
		$email_text = esc_html( $email );

		// Fix explanation for manual account creation only
		$fix_explanation = ' ' . __( 'Please create the missing account to resolve this issue.', 'wpcomsh' );

		switch ( $error_type ) {
			case 'wrong_owner_protected_owner_missing':
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'This site is connected, but the WordPress.com plan owner with email %s is missing.', 'wpcomsh' ),
					$email_text
				) . $fix_explanation;
			case 'no_user_connection_protected_owner_missing':
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'This site needs to be connected to WordPress.com by the plan owner account with email %s.', 'wpcomsh' ),
					$email_text
				) . $fix_explanation;
			default:
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'There is an issue with the connection owner for this site. The WordPress.com plan owner email is %s.', 'wpcomsh' ),
					$email_text
				) . $fix_explanation;
		}
	}

	/**
	 * Delete the stored error
	 */
	public function delete_error() {
		delete_option( self::STORED_ERRORS_OPTION );
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
	 * Handle context-specific error integration
	 */
	public function setup_context_specific_error_handling() {
		// Only proceed if we have an error to display
		if ( ! $this->get_error() ) {
			return;
		}

		// Detect the current admin page context
		$current_screen = get_current_screen();

		// Handle My Jetpack context
		if ( 'jetpack_page_my-jetpack' === $current_screen->id ) {
			$this->setup_my_jetpack_error_handling();
		} elseif ( in_array( $current_screen->id, array( 'admin_page_jetpack', 'toplevel_page_jetpack' ), true ) ) {
			// Handle main Jetpack Dashboard context
			$this->setup_jetpack_dashboard_error_handling();
		}
	}

	/**
	 * Setup error handling for My Jetpack context
	 */
	private function setup_my_jetpack_error_handling() {
		// For My Jetpack, inject errors directly into Error_Handler's verified errors
		add_filter( 'jetpack_connection_get_verified_errors', array( $this, 'add_to_verified_errors' ) );
	}

	/**
	 * Setup error handling for Jetpack Dashboard context
	 */
	private function setup_jetpack_dashboard_error_handling() {
		// For Jetpack Dashboard, use the existing react_connection_errors_initial_state filter
		add_filter( 'react_connection_errors_initial_state', array( $this, 'add_to_react_connection_errors' ) );
	}

	/**
	 * Add protected owner error to Error_Handler's verified errors
	 *
	 * @param array $verified_errors Current verified errors.
	 * @return array Updated verified errors including protected owner errors.
	 */
	public function add_to_verified_errors( $verified_errors ) {
		$protected_owner_error = $this->get_error();

		// Return early if no error
		if ( ! $protected_owner_error ) {
			return $verified_errors;
		}

		// Return only the protected owner error - it takes priority over other connection errors
		// since it's typically the root cause and other errors may be symptoms
		return $protected_owner_error;
	}

	/**
	 * Add protected owner errors to the react connection errors initial state
	 *
	 * @param array $errors Current errors.
	 * @return array Updated errors including protected owner errors.
	 */
	public function add_to_react_connection_errors( $errors ) {
		$verified_errors = $this->get_error();

		// Return early if no error
		if ( ! $verified_errors ) {
			return $errors;
		}

		// Ensure errors is an array
		$errors = is_array( $errors ) ? $errors : array();

		// Extract the first error from verified errors format
		$error_code    = key( $verified_errors );
		$user_errors   = reset( $verified_errors );
		$error_details = reset( $user_errors );

		$error_data = $error_details['error_data'];

		// Add error with only the "Create missing account" action
		$errors[] = array(
			'code'         => 'protected_owner_' . $error_code,
			'message'      => $error_details['error_message'],
			'action'       => 'protected_owner_action',
			'action_links' => array(
				array(
					'title'     => __( 'Create missing account', 'wpcomsh' ),
					'action'    => 'create_missing_account',
					'errorCode' => $error_code,
					'errorData' => $error_data,
					'variant'   => 'primary',
				),
			),
			'raw_error'    => $error_details,
			'can_be_fixed' => true,
		);

		return $errors;
	}

	/**
	 * Clear the error when a user with the required email address is created
	 *
	 * @param int $user_id The ID of the newly created user.
	 */
	public function check_and_clear_error_on_user_creation( $user_id ) {
		$this->check_and_clear_error_for_user( $user_id );
	}

	/**
	 * Clear the error when a user with the required email address is updated
	 *
	 * @param int $user_id The ID of the updated user.
	 */
	public function check_and_clear_error_on_user_update( $user_id ) {
		$this->check_and_clear_error_for_user( $user_id );
	}

	/**
	 * Check if the user matches the protected owner error and clear it if so
	 * This allows external healing code to automatically establish the connection
	 *
	 * @param int $user_id The ID of the user to check.
	 */
	private function check_and_clear_error_for_user( $user_id ) {
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
