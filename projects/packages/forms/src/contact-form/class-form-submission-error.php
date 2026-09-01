<?php
/**
 * Form_Submission_Error class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Custom error class for form submission errors.
 * Extends WP_Error to add error type classification.
 */
class Form_Submission_Error extends WP_Error {

	/**
	 * Error type constants.
	 */
	const TYPE_VALIDATION = 'validation';
	const TYPE_SYSTEM     = 'system';

	/**
	 * The error type (validation or system).
	 *
	 * @var string
	 */
	public $error_type;

	/**
	 * Constructor.
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @param string $type    Error type (validation or system).
	 */
	public function __construct( $code, $message, $type = self::TYPE_SYSTEM ) {
		parent::__construct( $code, $message );
		$this->error_type = $type;
	}

	/**
	 * Get the error type.
	 *
	 * @return string The error type.
	 */
	public function get_error_type() {
		return $this->error_type;
	}

	/**
	 * Check if this is a validation error.
	 *
	 * @return bool True if validation error, false otherwise.
	 */
	public function is_validation_type() {
		return self::TYPE_VALIDATION === $this->error_type;
	}

	/**
	 * Check if this is a system error.
	 *
	 * @return bool True if system error, false otherwise.
	 */
	public function is_system_type() {
		return self::TYPE_SYSTEM === $this->error_type;
	}

	/**
	 * Check if the given error is a Form Submission Error with system error type.
	 *
	 * @param mixed $error The error to check.
	 * @return bool True if the error is a Form_Submission_Error with system type, false otherwise.
	 */
	public static function is_system_error( $error ) {
		return $error instanceof self && $error->is_system_type();
	}

	/**
	 * Check if the given error is a Form Submission Error with validation error type.
	 *
	 * @param mixed $error The error to check.
	 * @return bool True if the error is a Form_Submission_Error with validation type, false otherwise.
	 */
	public static function is_validation_error( $error ) {
		return $error instanceof self && $error->is_validation_type();
	}

	/**
	 * Create a validation Form Submission Error.
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @return Form_Submission_Error The validation error instance.
	 */
	public static function validation_error( $code, $message ) {
		return new self( $code, $message, self::TYPE_VALIDATION );
	}

	/**
	 * Create a system Form Submission Error.
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @return Form_Submission_Error The system error instance.
	 */
	public static function system_error( $code, $message ) {
		return new self( $code, $message, self::TYPE_SYSTEM );
	}
}
