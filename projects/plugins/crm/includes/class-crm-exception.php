<?php
/**
 * Jetpack CRM Exception Class
 * Extends Exception to provide additional data.
 *
 */

namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * CRM exception class.
 */
class CRM_Exception extends \Exception {

	/**
	 * Sanitized error code.
	 *
	 * @var string
	 */
	protected $error_code;

	/**
	 * Error extra data.
	 *
	 * @var array
	 */
	protected $error_data;

	/**
	 * Setup exception.
	 *
	 * @param string $code             Machine-readable error code, e.g `segment_condition_produces_no_args`.
	 * @param string $message          User-friendly translated error message, e.g. 'Segment Condition produces no filtering arguments'.	 
	 * @param array  $data             Extra error data.
	 */
	public function __construct( $code, $message, $data = array() ) {

		$this->error_code = $code;
		$this->error_data = $data;

		parent::__construct( $message . ' (' . $code . ')', 0, null );

	}

	/**
	 * Returns the error code.
	 *
	 * @return string
	 */
	public function get_error_code() {
		return $this->error_code;
	}

	/**
	 * Returns error data.
	 *
	 * @return array
	 */
	public function get_error_data() {
		return $this->error_data;
	}
}