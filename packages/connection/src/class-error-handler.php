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
	const STORED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_errors';

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
		$stored_errors = $this->get_stored_errors();

		$data       = $error->get_error_data();
		$error_code = $error->get_error_code();

		if ( ! isset( $data['signature_details'] ) || ! is_array( $data['signature_details'] ) ) {
			return false;
		}

		$data = $data['signature_details'];

		if ( ! isset( $data['token'] ) || empty( $data['token'] ) ) {
			return false;
		}

		$user_id = $this->get_user_id_from_token( $data['token'] );

		if ( ! isset( $stored_errors[ $error_code ] ) || ! is_array( $stored_errors[ $error_code ] ) ) {
			$stored_errors[ $error_code ] = array();
		}

		$stored_errors[ $error_code ][ $user_id ] = array(
			'error_code'    => $error_code,
			'error_message' => $error->get_error_message(),
			'error_data'    => $data,
			'timestamp'     => time(),
			'nonce'         => wp_generate_password( 10, false ),
		);

		// Let's store a maximum of 5 different user ids for each error code.
		if ( count( $stored_errors[ $error_code ] ) > 5 ) {
			array_shift( $stored_errors[ $error_code ] );
		}

		return update_option( self::STORED_ERRORS_OPTION, $stored_errors );
	}

	/**
	 * Extracts the user ID from a token
	 *
	 * @param string $token the token used to make the xml-rpc request.
	 * @return string $the user id or `invalid` if user id not present.
	 */
	public function get_user_id_from_token( $token ) {
		$parsed_token = explode( ':', wp_unslash( $token ) );

		if ( isset( $parsed_token[2] ) && ! empty( $parsed_token[2] ) && ctype_digit( $parsed_token[2] ) ) {
			$user_id = $parsed_token[2];
		} else {
			$user_id = 'invalid';
		}

		return $user_id;

	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @return array $errors
	 */
	public function get_stored_errors() {
		$stored_errors = get_option( self::STORED_ERRORS_OPTION );
		if ( ! is_array( $stored_errors ) ) {
			$stored_errors = array();
		}
		return $stored_errors;
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
