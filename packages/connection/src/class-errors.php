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
class Errors {

	/**
	 * Return the code and details of all known errors.
	 *
	 * @return array
	 */
	public function get_errors() {

		$errors = array(
			array(
				'code'         => 'unknown_error',
				'title'        => __( 'Unknown connection error', 'jetpack' ),
				'fix_tip'      => __( 'Unknown connection error', 'jetpack' ),
				'fix_url'      => '',
				'fix_callback' => null,
			),

			array(
				'code'         => 'malformed_token',
				'title'        => __( 'Malformed token', 'jetpack' ),
				'fix_tip'      => __( 'The token used to authenticate requests between your site and WordPress.com is invalid. Try resetting the connection', 'jetpack' ),
				'fix_url'      => '', // The URL of a call to action button to fix it.
				'fix_label'    => 'Reconnect', // The label of a call to action button to fix it.
				'fix_callback' => array( $this, 'fix_disconnect' ), // a callback that will be invoked to try to fix the issue locally.
			),
		);

		return apply_filters( 'jetpack_connection_errors', $errors );

	}

	/**
	 * Gets the details for one specific error code
	 *
	 * @param string $error_code the error code.
	 * @return array $error the error details
	 */
	public function get_error( $error_code ) {
		$errors = $this->get_errors();
		return isset( $errors[ $error_code ] ) ? $errors[ $error_code ] : $errors['unknow_error'];
	}

	/**
	 * Keep track of a connection error that was encoutered
	 *
	 * @param Connection_Error $error the error object.
	 * @return void
	 */
	public function report_error( Connection_Error $error ) {
		$this->store_error( $error );
		$this->inform_wpcom( $error );
	}

	/**
	 * Stores the error in the database so we know there is an issue and can inform the user
	 *
	 * @param Connection_Error $error the error object.
	 * @return void
	 */
	public function store_error( Connection_Error $error ) {
		// store the error on the database so we can display feedback to the user.
	}

	/**
	 * Informs wpcom servers about the error
	 *
	 * @param Connection_Error $error the error object.
	 * @return void
	 */
	public function inform_wpcom( Connection_Error $error ) {
		// securely inform wpcom about the error (via sync?) so Calypso knows about it and it can trigger some self-healing routine.
	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @return array $errors
	 */
	public function get_stored_errors() {
		// retireve errors from the database
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @return array $errors
	 */
	public function delete_stored_errors() {
		// delete errors from the database
	}

	/**
	 * Tries to fix connection errors by disconnecting the site
	 *
	 * After disconnecting, clear the reported errors.
	 *
	 * @return void
	 */
	public function fix_disconnect() {
		// calls the manager disconnect routine

		$this->delete_stored_errors();
	}

}
