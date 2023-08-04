<?php
/**
 * Defines Jetpack CRM Automation exceptions.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Exception class.
 *
 * @since $$next-version$$
 */
class Automation_Exception extends \Exception {
	const STEP_CLASS_NOT_FOUND    = 10;
	const STEP_SLUG_EXISTS        = 11;
	const STEP_SLUG_EMPTY         = 12;
	const TRIGGER_CLASS_NOT_FOUND = 20;
	const TRIGGER_SLUG_EXISTS     = 21;
	const TRIGGER_SLUG_EMPTY      = 22;
	const GENERAL_ERROR           = 999;

	/**
	 * Automation_Exception constructor.
	 *
	 * @param string $message Allows an exception message to be passed.
	 * @param int    $code The error code to be included in the exception output.
	 */
	public function __construct( $message = 'Automation Exception', $code = self::GENERAL_ERROR ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found
		parent::__construct( $message, $code );
	}
}
