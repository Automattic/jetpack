<?php
/**
 * The Jetpack Connection error class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection Errors that handles errors
 */
class Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_xmlrpc_errors';

	/**
	 * The prefix of the transient that controls the gate for each error code
	 *
	 * @var string
	 */
	const ERROR_REPORTING_GATE = 'jetpack_connection_error_reporting_gate_';

	/**
	 * Return the code and details of all known errors.
	 *
	 * @return array
	 */
	public function get_errors() {

		$errors = array(
			'unknown_error'   => array(
				'title'        => __( 'Unknown connection error', 'jetpack' ),
				'fix_tip'      => __( 'Unknown connection error', 'jetpack' ),
				'fix_url'      => '',
				'fix_callback' => null,
			),

			'malformed_token' => array(
				'title'        => __( 'Malformed token', 'jetpack' ),
				'fix_tip'      => __( 'The token used to authenticate requests between your site and WordPress.com is invalid. Try resetting the connection', 'jetpack' ),
				'fix_url'      => '', // The URL of a call to action button to fix it.
				'fix_label'    => 'Reconnect', // The label of a call to action button to fix it.
				'fix_callback' => array( $this, 'fix_disconnect' ), // a callback that will be invoked to try to fix the issue locally.
			),

			'unknown_user'    => array(
				'title'   => __( 'Unknown User', 'jetpack' ),
				'fix_tip' => __( 'There is a connection between WordPress.com and a user that no longer exists on your site. If a user was deleted, information on WordPress.com must be updated and you might need to reconnect with a different user.', 'jetpack' ),
				'fix_url' => '', // The URL of a call to action button to fix it.
				// 'fix_label'    => 'Reconnect', // The label of a call to action button to fix it.
				// 'fix_callback' => array( $this, 'fix_disconnect' ), // a callback that will be invoked to try to fix the issue locally.
			),
		);

		return apply_filters( 'jetpack_connection_errors', $errors );

	}

	/**
	 * Keep track of a connection error that was encoutered
	 *
	 * @param \WP_Error $error the error object.
	 * @param boolean   $force Force the report, even if should_report_error is false.
	 * @return void
	 */
	public function report_error( \WP_Error $error, $force = false ) {
		if ( $this->should_report_error( $error ) || $force ) {
			$this->store_error( $error );
			$this->inform_wpcom( $error );
		}
	}

	/**
	 * Checks the status of the gate
	 *
	 * This protects the site (and WPCOM) against over loads.
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean $should_report True if gate is open and the error should be reported.
	 */
	public function should_report_error( \WP_Error $error ) {

		if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
			return true;
		}

		$transient = self::ERROR_REPORTING_GATE . $error->get_error_code();

		if ( get_transient( $transient ) ) {
			return false;
		}

		set_transient( $transient, true, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Stores the error in the database so we know there is an issue and can inform the user
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean False if stored errors were not updated and true if stored errors were updated.
	 */
	public function store_error( \WP_Error $error ) {
		$stored_errors                             = $this->get_stored_errors();
		$stored_errors[ $error->get_error_code() ] = array(
			'error_code'    => $error->get_error_code(),
			'error_message' => $error->get_error_message(),
			'error_data'    => $error->get_error_data(),
		);
		return update_option( self::STORED_ERRORS_OPTION, $stored_errors );
	}

	/**
	 * Informs wpcom servers about the error
	 *
	 * @param \WP_Error $error the error object.
	 * @return void
	 */
	public function inform_wpcom( \WP_Error $error ) {
		// securely inform wpcom about the error (via sync?) so Calypso knows about it and it can trigger some self-healing routine.
	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @return \WP_Error[] $errors
	 */
	public function get_stored_errors() {
		$stored_errors = get_option( self::STORED_ERRORS_OPTION );
		if ( ! is_array( $stored_errors ) ) {
			$stored_errors = array();
		}
		return array_map(
			function( $error ) {
				return new \WP_Error( $error['error_code'], $error['error_message'], $error['error_data'] );
			},
			$stored_errors
		);
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_stored_errors() {
		return delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Add notices to the Admin Notices section if there are known connection errors
	 *
	 * @return void
	 */
	public function admin_notices() {

		/**
		 * Determines whether the Connection package will display connection errors to the user.
		 *
		 * @since 8.7.0
		 *
		 * @param bool $display_error_messages Defaults to true.
		 */
		$display_error_messages = apply_filters( 'jetpack_connection_display_errors', true );

		if ( true !== $display_error_messages ) {
			return;
		}

		$errors = $this->get_stored_errors();
		if ( count( $errors ) ) {
			foreach ( $errors as $error ) {

				/**
				 * Determines whether the Connection package will display a specific connection error to the user.
				 *
				 * The dynamic part of the hook is the error code.
				 *
				 * @since 8.7.0
				 *
				 * @param bool $display_error_message Defaults to true.
				 */
				$error_code            = $error->get_error_code();
				$display_error_message = apply_filters( "jetpack_connection_display_error_{$error_code}", true );

				if ( true !== $display_error_message ) {
					continue;
				}

				require 'connection-errors-notices-template.php';
			}
		}
	}

}
