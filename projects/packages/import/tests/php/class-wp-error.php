<?php
/**
 * Minimal `WP_Error` stand-in for Brain Monkey-based tests.
 *
 * The Import package does not depend on a full WordPress test environment —
 * Brain Monkey stubs the global functions but does not declare WP classes —
 * so abilities tests that exercise the WP_Error return path need this shim.
 * Only the methods touched by assertions are implemented.
 *
 * @package automattic/jetpack-import
 */

if ( ! class_exists( 'WP_Error' ) ) {

	/**
	 * Bare-bones WP_Error shim.
	 */
	class WP_Error {

		/**
		 * Error code.
		 *
		 * @var string
		 */
		private $code;

		/**
		 * Error message.
		 *
		 * @var string
		 */
		private $message;

		/**
		 * Construct.
		 *
		 * @param string $code    Code.
		 * @param string $message Message.
		 * @param mixed  $data    Data (ignored by this stub).
		 */
		public function __construct( $code = '', $message = '', $data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$this->code    = (string) $code;
			$this->message = (string) $message;
		}

		/**
		 * Return the first error code.
		 */
		public function get_error_code() {
			return $this->code;
		}

		/**
		 * Return the first error message.
		 */
		public function get_error_message() {
			return $this->message;
		}
	}
}
