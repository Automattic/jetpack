<?php
/**
 * The Jetpack Connection error class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection Error class represents one Connection Error
 */
class Connection_Error extends \WP_Error {

	/**
	 * Stores the list of data for error codes.
	 *
	 * @var array
	 */
	public $error_info = array();

	public function __construct( $error_code, $data ) {

		$this->errors_handler = new Errors();

		$error = $this->errors_handler->get_error( $error_code );

		parent::__construct(
			$error_code,
			$error['title'],
			$data
		);

		$this->error_info[ $error_code ] = $error;

		$this->errors_handler->report_error( $this );

	}

}
