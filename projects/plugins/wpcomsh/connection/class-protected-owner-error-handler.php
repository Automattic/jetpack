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
		// Handle verified errors on admin pages
		add_action( 'admin_init', array( $this, 'handle_verified_errors' ) );

		// Clear errors on reconnection or token updates
		add_action( 'jetpack_site_registered', array( $this, 'delete_error' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_error_and_return_unfiltered_value' ) );
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_error' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_error' ) );

		// Add filter to expose protected owner errors to Jetpack
		add_filter( 'jetpack_connection_protected_owner_error', array( $this, 'get_error' ) );

		// Provide the error handler instance to Jetpack Manager
		add_filter( 'jetpack_connection_protected_owner_error_handler', array( __CLASS__, 'get_instance' ) );
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
	 * Get the stored error from the database and process it to the expected format
	 *
	 * @return array|false The processed error in the expected format or false if no error is stored or valid.
	 */
	public function get_error() {
		// Get the raw error data from the option
		$raw_error = get_option( self::STORED_ERRORS_OPTION, false );

		// Return early if no error is stored
		if ( ! $raw_error || ! is_array( $raw_error ) ) {
			return false;
		}

		// Validate the minimal required fields
		if ( ! isset( $raw_error['error_type'] ) || ! isset( $raw_error['wpcom_email'] ) ) {
			return false;
		}

		// Get the master user (connection owner) ID
		$master_user_id = \Jetpack_Options::get_option( 'master_user' );
		$master_user    = $master_user_id ? get_user_by( 'id', $master_user_id ) : false;

		// Determine the error code based on error_type and current connection state
		$error_code = $this->determine_error_code( $raw_error, $master_user_id, $master_user );

		// If error_code is false, no valid error condition exists
		if ( ! $error_code ) {
			$this->delete_error();
			return false;
		}

		// Create an error structure similar to Jetpack's error format
		$user_id = isset( $raw_error['protected_owner_local_id'] ) ? $raw_error['protected_owner_local_id'] : '0';

		// Generate a timestamp if one doesn't exist
		$timestamp = isset( $raw_error['timestamp'] ) ? $raw_error['timestamp'] : time();

		// Create the formatted error
		$formatted_error = array(
			'protected_owner_error' => array(
				$user_id => array(
					'error_code'    => $error_code,
					'user_id'       => $user_id,
					'error_message' => $this->get_error_message( $error_code, $raw_error['wpcom_email'] ),
					'error_data'    => array(
						'wpcom_email' => $raw_error['wpcom_email'],
						'error_type'  => $raw_error['error_type'],
					),
					'timestamp'     => $timestamp,
					'nonce'         => wp_generate_password( 10, false ),
					'error_type'    => 'protected_owner',
				),
			),
		);

		return $formatted_error;
	}

	/**
	 * Determine the error code based on the raw error data and current connection state
	 *
	 * @param array        $raw_error      The raw error data.
	 * @param int|bool     $master_user_id The master user ID or false if not set.
	 * @param WP_User|bool $master_user The master user object or false if not exists.
	 * @return string|false The determined error code or false if no valid error.
	 */
	private function determine_error_code( $raw_error, $master_user_id, $master_user ) {
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
	 * Handle verified errors by adding them to the admin notices
	 */
	public function handle_verified_errors() {
		$error = $this->get_error();
		if ( $error ) {
			add_action( 'react_connection_errors_initial_state', array( $this, 'jetpack_react_dashboard_error' ) );
		}
	}

	/**
	 * Get a user-friendly error message based on the error type
	 *
	 * @param string $error_type The type of error.
	 * @param string $wpcom_email The WordPress.com email address of the protected owner.
	 * @return string The error message.
	 */
	protected function get_error_message( $error_type, $wpcom_email ) {
		// Format the email for display
		$email_html = '<strong>' . esc_html( $wpcom_email ) . '</strong>';

		// Common fix explanation to append to all messages
		$fix_explanation = ' ' . __( 'You can either create the missing account manually or enable automatic fixes for this issue.', 'wpcomsh' );

		switch ( $error_type ) {
			case 'wrong_owner_protected_owner_missing':
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'This site is connected to WordPress.com, but the WordPress.com plan owner with email %s is missing.', 'wpcomsh' ),
					$email_html
				) . $fix_explanation;//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			case 'no_user_connection_protected_owner_missing':
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'This site needs to be connected to WordPress.com by the plan owner account with email %s.', 'wpcomsh' ),
					$email_html
				) . $fix_explanation;//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			default:
				return sprintf(
					// translators: %s is the WordPress.com email address
					__( 'There is an issue with the connection owner for this site. The WordPress.com plan owner email is %s.', 'wpcomsh' ),
					$email_html
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
	 * Add protected owner errors to the Jetpack React dashboard
	 *
	 * @param array $errors Current errors.
	 * @return array Updated errors including protected owner errors.
	 */
	public function jetpack_react_dashboard_error( $errors ) {
		$protected_owner_error = $this->get_error();

		// Return early if no error or permanent fix has been applied
		if ( ! $protected_owner_error ) {
			return $errors;
		}

		// Ensure errors is an array
		$errors = is_array( $errors ) ? $errors : array();

		// Extract error data
		$first_error = reset( $protected_owner_error['protected_owner_error'] );
		$error_code  = $first_error['error_code'];
		$error_data  = $first_error['error_data'];

		// Check if a permanent fix has been applied
		$permission_handler = Protected_Owner_Permission_Handler::get_instance();
		if ( $permission_handler->has_permanent_fix() ) {
			return $errors;
		}

		// Add error with action links
		$errors[] = array(
			'code'           => 'protected_owner_' . $error_code,
			'message'        => $this->get_error_message( $error_code, $error_data['wpcom_email'] ),
			'action'         => 'protected_owner_action',
			'action_links'   => array(
				array(
					'title'     => __( 'Create missing account', 'wpcomsh' ),
					'action'    => 'create_missing_account',
					'errorCode' => $error_code,
					'errorData' => $error_data,
					'variant'   => 'secondary',
				),
				array(
					'title'     => __( 'Enable automated fix', 'wpcomsh' ),
					'action'    => 'fix_protected_owner_permanent',
					'errorCode' => $error_code,
					'errorData' => $error_data,
					'variant'   => 'primary',
				),
			),
			'raw_error'      => $protected_owner_error,
			'can_be_fixed'   => true,
			'is_self_fixing' => $this->has_self_heal_errors(),
		);

		return $errors;
	}

	/**
	 * Check if the current error is one that can be self-healed
	 *
	 * @return bool Whether the current error can be self-healed
	 */
	public function has_self_heal_errors() {
		$error = $this->get_error();
		if ( ! $error ) {
			return false;
		}

		// Extract the first error to check its code
		$first_error = reset( $error['protected_owner_error'] );
		$error_code  = $first_error['error_code'];

		// These error types can be automatically fixed
		$self_healable_errors = array(
			'wrong_owner_protected_owner_missing',
			'no_user_connection_protected_owner_missing',
		);

		return in_array( $error_code, $self_healable_errors, true );
	}
}
