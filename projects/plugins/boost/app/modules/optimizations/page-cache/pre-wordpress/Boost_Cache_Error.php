<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/**
 * A replacement for WP_Error when working in a Pre_WordPress setting.
 *
 * This class deliberately offers a similar API to WP_Error for familiarity. All Pre_WordPress functions
 * which may return an error object use this class to represent an Error state.
 *
 * If you call a Pre_WordPress function after loading WordPress, use to_wp_error to convert these
 * objects to a standard WP_Error object.
 */
class Boost_Cache_Error {

	/**
	 * @var string - The error code.
	 */
	private $code;

	/**
	 * @var string - The error message.
	 */
	private $message;

	/**
	 * Create a Boost_Cache_Error object, with a code and a message.
	 */
	public function __construct( $code, $message ) {
		$this->code    = $code;
		$this->message = $message;
	}

	/**
	 * Return the error message.
	 */
	public function get_error_message() {
		return $this->message;
	}

	/**
	 * Return the error code.
	 */
	public function get_error_code() {
		return $this->code;
	}

	/**
	 * Convert to a WP_Error.
	 *
	 * When calling a Pre_WordPress function from a WordPress context, use this method to convert
	 * any resultant errors to WP_Errors for interfacing with other WordPress APIs.
	 *
	 * **Warning** - this function should only be called if WordPress has been loaded!
	 */
	public function to_wp_error() {
		if ( ! class_exists( '\WP_Error' ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Warning: Boost_Cache_Error::to_wp_error called from a Pre-WordPress context' );
			}
		}

		return new \WP_Error( $this->get_error_code(), $this->get_error_message() );
	}
}
