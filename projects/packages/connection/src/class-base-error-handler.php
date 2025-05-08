<?php
/**
 * The Jetpack Connection Base Error Handler class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;

/**
 * The Jetpack Connection Base Error Handler abstract class.
 *
 * This abstract class serves as a base for specialized error handlers in the Jetpack Connection.
 * It provides common functionality for storing, verifying, and displaying connection errors.
 *
 * @since $$next-version$$
 */
abstract class Base_Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_errors';

	/**
	 * The name of the option that stores the verified errors
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const STORED_VERIFIED_ERRORS_OPTION = 'jetpack_connection_verified_errors';

	/**
	 * The prefix of the transient that controls the gate for each error code
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	const ERROR_REPORTING_GATE = 'jetpack_connection_error_reporting_gate_';

	/**
	 * Time in seconds a test should live in the database before being discarded
	 *
	 * @since $$next-version$$
	 */
	const ERROR_LIFE_TIME = DAY_IN_SECONDS;

	/**
	 * Holds the instance of this singleton class
	 *
	 * @since $$next-version$$
	 *
	 * @var Base_Error_Handler $instance
	 */
	protected static $instance = null;

	/**
	 * Initialize instance and register hooks
	 *
	 * @since $$next-version$$
	 */
	protected function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'admin_init', array( $this, 'handle_verified_errors' ) );

		// If the site gets reconnected, clear errors.
		add_action( 'jetpack_site_registered', array( $this, 'delete_all_errors' ) );
		add_action( 'jetpack_get_site_data_success', array( $this, 'delete_all_api_errors' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_all_errors_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_all_errors_and_return_unfiltered_value' ) );
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_all_errors' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_all_errors' ) );
	}

	/**
	 * Register REST API routes
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	abstract public function register_rest_routes();

	/**
	 * Gets a user-friendly error message based on the error type
	 *
	 * @since $$next-version$$
	 *
	 * @param string $error_type The type of error.
	 * @return string The error message.
	 */
	abstract protected function get_error_message( $error_type );

	/**
	 * Send the error to WordPress.com for verification
	 *
	 * @since $$next-version$$
	 *
	 * @param array $error_array The error to send.
	 * @return bool|mixed The result of the sending operation.
	 */
	abstract public function send_error_to_wpcom( $error_array );

	/**
	 * Keep track of a connection error that was encountered
	 *
	 * @param \WP_Error $error  The error object.
	 * @param boolean   $force  Force the report, even if should_report_error is false.
	 * @param boolean   $skip_wpcom_verification Set to 'true' to verify the error locally and skip the WP.com verification.
	 *
	 * @return void
	 * @since $$next-version$$
	 */
	public function report_error( \WP_Error $error, $force = false, $skip_wpcom_verification = false ) {
		if ( $this->should_report_error( $error ) || $force ) {
			$stored_error = $this->store_error( $error );
			if ( $stored_error ) {
				$skip_wpcom_verification ? $this->verify_error( $stored_error ) : $this->send_error_to_wpcom( $stored_error );
			}
		}
	}

	/**
	 * Checks the status of the gate
	 *
	 * This protects the site (and WPCOM) against over loads.
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean $should_report True if gate is open and the error should be reported.
	 */
	public function should_report_error( \WP_Error $error ) {
		if ( Constants::get_constant( 'JETPACK_DEV_DEBUG' ) ) {
			return true;
		}

		/**
		 * Whether to bypass the gate for the error handling
		 *
		 * By default, we only process errors once an hour for each error code.
		 * This is done to avoid overflows. If you need to disable this gate, you can set this variable to true.
		 *
		 * This filter is useful for unit testing
		 *
		 * @since $$next-version$$
		 *
		 * @param boolean $bypass_gate whether to bypass the gate. Default is false, do not bypass.
		 */
		$bypass_gate = apply_filters( 'jetpack_connection_bypass_error_reporting_gate', false );
		if ( true === $bypass_gate ) {
			return true;
		}

		$error_code = $error->get_error_code();
		$gate_id    = self::ERROR_REPORTING_GATE . $error_code;

		return ! get_transient( $gate_id );
	}

	/**
	 * Stores the error in the database so we know there is an issue and can inform the user
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if stored errors were not updated and the error array if it was successfully stored.
	 */
	public function store_error( \WP_Error $error ) {
		$error_code = $error->get_error_code();
		$gate_id    = self::ERROR_REPORTING_GATE . $error_code;
		// Set a transient to prevent overflows and repetitions of the same errors.
		set_transient( $gate_id, true, HOUR_IN_SECONDS );

		$error_array = $this->wp_error_to_array( $error );
		$errors      = $this->get_stored_errors();
		$user_id     = $error_array['user_id'];

		// Store max 5 errors per error code.
		if ( ! isset( $errors[ $error_code ] ) ) {
			$errors[ $error_code ] = array();
		}

		// Store max 1 error per user_id.
		$errors[ $error_code ][ $user_id ] = $error_array;

		// Garbage collect and if needed trim the errors.
		$errors = $this->garbage_collector( $errors );

		update_option( static::STORED_ERRORS_OPTION, $errors );

		return $error_array;
	}

	/**
	 * Converts a WP_Error object in the array representation we store in the database
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if error is invalid or the error array
	 */
	public function wp_error_to_array( \WP_Error $error ) {
		$error_data = $error->get_error_data();
		$user_id    = 0;

		if ( is_array( $error_data ) && isset( $error_data['user_id'] ) ) {
			$user_id = $error_data['user_id'];
		}

		return array(
			'error_code'    => $error->get_error_code(),
			'error_message' => $error->get_error_message(),
			'error_data'    => $error_data,
			'user_id'       => $user_id,
			'timestamp'     => time(),
			'nonce'         => wp_generate_password( 10, false ),
		);
	}

	/**
	 * Adds an error to the verified error list
	 *
	 * @since $$next-version$$
	 *
	 * @param array $error The error array, as it was saved in the unverified errors list.
	 * @return boolean True if option is successfully updated, false on failure.
	 */
	public function verify_error( $error ) {
		$errors = get_option( static::STORED_VERIFIED_ERRORS_OPTION, array() );

		$error_code = $error['error_code'];
		$user_id    = $error['user_id'];

		if ( ! isset( $errors[ $error_code ] ) ) {
			$errors[ $error_code ] = array();
		}

		// Store max 1 error per user_id.
		$errors[ $error_code ][ $user_id ] = $error;

		// Garbage collect and if needed trim the errors.
		$errors = $this->garbage_collector( $errors );

		return update_option( static::STORED_VERIFIED_ERRORS_OPTION, $errors );
	}

	/**
	 * Handle verified errors by adding them to the admin notices
	 *
	 * @since $$next-version$$
	 */
	public function handle_verified_errors() {
		$verified_errors = $this->get_verified_errors();
		if ( ! empty( $verified_errors ) ) {
			add_action( 'admin_notices', array( $this, 'generic_admin_notice_error' ) );
			add_action( 'react_connection_errors_initial_state', array( $this, 'jetpack_react_dashboard_error' ) );
		}
	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @since $$next-version$$
	 *
	 * @return array $errors
	 */
	public function get_stored_errors() {
		return get_option( static::STORED_ERRORS_OPTION, array() );
	}

	/**
	 * Gets the verified errors stored in the database
	 *
	 * @since $$next-version$$
	 *
	 * @return array $errors
	 */
	public function get_verified_errors() {
		$errors = get_option( static::STORED_VERIFIED_ERRORS_OPTION, array() );
		return $this->garbage_collector( $errors );
	}

	/**
	 * Removes expired errors from the array
	 *
	 * This method is called by get_stored_errors and get_verified errors and filters their result
	 * Whenever a new error is stored to the database or verified, this will be triggered and the
	 * expired error will be permantently removed from the database
	 *
	 * @since $$next-version$$
	 *
	 * @param array $errors array of errors as stored in the database.
	 * @return array
	 */
	protected function garbage_collector( $errors ) {
		$now = time();
		foreach ( $errors as $error_code => $users ) {
			foreach ( $users as $user_id => $error ) {
				if ( isset( $error['timestamp'] ) && $now - $error['timestamp'] > self::ERROR_LIFE_TIME ) {
					unset( $errors[ $error_code ][ $user_id ] );
				}
			}

			if ( empty( $errors[ $error_code ] ) ) {
				unset( $errors[ $error_code ] );
			}
		}

		return $errors;
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @since $$next-version$$
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_stored_errors() {
		return delete_option( static::STORED_ERRORS_OPTION );
	}

	/**
	 * Delete the verified errors stored in the database
	 *
	 * @since $$next-version$$
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_verified_errors() {
		return delete_option( static::STORED_VERIFIED_ERRORS_OPTION );
	}

	/**
	 * Delete all stored and verified errors from the database
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function delete_all_errors() {
		$this->delete_stored_errors();
		$this->delete_verified_errors();
	}

	/**
	 * Delete all errors and return the unfiltered value
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $check The value to return.
	 * @return mixed The unfiltered value.
	 */
	public function delete_all_errors_and_return_unfiltered_value( $check ) {
		$this->delete_all_errors();
		return $check;
	}

	/**
	 * Delete all API errors
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function delete_all_api_errors() {
		$this->delete_all_errors();
	}

	/**
	 * Gets an error based on the nonce
	 *
	 * Receives a nonce and finds the related error.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $nonce The nonce created for the error we want to get.
	 * @return null|array Returns the error array representation or null if error not found.
	 */
	public function get_error_by_nonce( $nonce ) {
		$errors = $this->get_stored_errors();

		foreach ( $errors as $users ) {
			foreach ( $users as $error ) {
				if ( isset( $error['nonce'] ) && $error['nonce'] === $nonce ) {
					return $error;
				}
			}
		}

		return false;
	}

	/**
	 * Prints a generic error notice for all connection errors
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function generic_admin_notice_error() {
		// do not add admin notice to the jetpack dashboard.
		global $pagenow;
		if ( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'jetpack' === $_GET['page'] ) { // phpcs:ignore
			return;
		}

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}

		$verified_errors = $this->get_verified_errors();
		if ( empty( $verified_errors ) ) {
			return;
		}

		// Get the first error code and its first error entry
		$error_code = key( $verified_errors );
		$message    = $this->get_error_message( $error_code );

		wp_admin_notice(
			esc_html( $message ),
			array(
				'type'               => 'error',
				'dismissible'        => true,
				'additional_classes' => array( 'jetpack-message', 'jp-connect' ),
				'attributes'         => array( 'style' => 'display:block !important;' ),
			)
		);
	}

	/**
	 * Adds the error message to the Jetpack React Dashboard
	 *
	 * @since $$next-version$$
	 *
	 * @param array $errors The array of errors. See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
	 * @return array
	 */
	public function jetpack_react_dashboard_error( $errors ) {
		$verified_errors = $this->get_verified_errors();
		if ( empty( $verified_errors ) ) {
			return $errors;
		}

		// Get the first error code
		$error_code = key( $verified_errors );
		$message    = $this->get_error_message( $error_code );

		$errors[] = array(
			'code'    => $error_code,
			'message' => $message,
			'action'  => 'reconnect',
		);

		return $errors;
	}
}
