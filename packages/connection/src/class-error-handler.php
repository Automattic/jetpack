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
	 * Keep track of a connection error that was encoutered
	 *
	 * @param \WP_Error $error the error object.
	 * @param boolean   $force Force the report, even if should_report_error is false.
	 * @return void
	 */
	public function report_error( \WP_Error $error, $force = false ) {
		if ( $this->should_report_error( $error ) || $force ) {
			$this->store_error( $error );
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
			'timestamp'     => time(),
			'nonce'         => wp_generate_password( 10, false ),
		);
		return update_option( self::STORED_ERRORS_OPTION, $stored_errors );
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

}
