<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/**
 * A class to represent an error state. Deliberately offers part of the WP_Error API, so that WP_Errors
 * can be treated as Boost_Cache_Errors safely.
 *
 * Use this in any code which runs before WP_Error may be defined.
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
	 * Call this static method to determine if a target object looks like a WP_Error or a Boost_Cache_Error
	 * object. After this check, it is safe to call get_error_message or get_error_code on it.
	 */
	public static function is_error( $target ) {
		if ( class_exists( '\WP_Error' ) ) {
			if ( $target instanceof \WP_Error ) {
				return true;
			}
		}

		return $target instanceof self;
	}
}
