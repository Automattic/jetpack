<?php
/**
 * Base Exception.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */

namespace Automattic\Jetpack_CRM\REST_API\Exception;

defined( 'ABSPATH' ) || exit;

use Exception;
use Throwable;
use WP_Error;

/**
 * Base Exception.
 *
 * All Jetpack CRM API exceptions should extend this one.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */
class Base_Exception extends Exception {
	/**
	 * WP error code.
	 *
	 * @var string
	 */
	protected $wp_error_code = '';

	/**
	 * Extra arbitrary data.
	 *
	 * @var array
	 */
	protected $wp_error_data = array();

	/**
	 * Constructor.
	 *
	 * @param string         $error_code Exception error code.
	 * @param string         $message Exception message.
	 * @param array          $data Extra arbitrary data relevant to the exception.
	 * @param int            $code Exception code.
	 * @param Throwable|null $previous Previous exception.
	 */
	public function __construct( string $error_code, string $message, array $data = array(), int $code = 1, Throwable $previous = null ) {
		parent::__construct( $message, $code, $previous );

		$this->wp_error_code = $error_code;
		$this->wp_error_data = $data;
	}

	/**
	 * Get the error code string.
	 *
	 * @return string
	 */
	public function get_error_code(): string {
		return $this->wp_error_code;
	}

	/**
	 * Get the error message.
	 *
	 * Alias for Coupon_Exception::getMessage() for consistency.
	 *
	 * @return string
	 */
	public function get_error_message(): string {
		return $this->getMessage();
	}

	/**
	 * Get any arbitrary data added to the exception.
	 *
	 * @return array
	 */
	public function get_error_data(): array {
		return $this->wp_error_data;
	}

	/**
	 * Get a WP_Error instance representing this exception.
	 *
	 * @param array $data Optional extra data array to inject into the WP Error instance for convenience (e.g. status).
	 * @return WP_Error
	 */
	public function get_wp_error( array $data = array() ): WP_Error {
		return new WP_Error(
			$this->get_error_code(),
			$this->get_error_message(),
			array_merge(
				array( 'trace' => $this->getTraceAsString() ),
				$this->get_error_data(),
				$data
			)
		);
	}
}
