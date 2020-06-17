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

	public function __construct( $error_code, $data, $report = true ) {

		$this->errors_handler = new Errors();

		$error = $this->errors_handler->get_error( $error_code );

		parent::__construct(
			$error_code,
			$error['title'],
			$data
		);

		$this->error_info[ $error_code ] = $error;

		if ( $report ) {
			$this->errors_handler->report_error( $this );
		}

	}

	public function get_info( $info_key = '', $code = '' ) {
		if ( empty( $code ) ) {
			$code = $this->get_error_code();
		}
		if ( isset( $this->error_info[ $code ] ) ) {
			if ( empty( $info_key ) ) {
				return $this->error_info[ $code ];
			}

			if ( isset( $this->error_info[ $code ][ $info_key ] ) ) {
				return $this->error_info[ $code ][ $info_key ];
			}
		}
	}

	public function get_title( $code = '' ) {
		return $this->get_info( 'title', $code );
	}

	public function get_fix_tip( $code = '' ) {
		return $this->get_info( 'fix_tip', $code );
	}

}
