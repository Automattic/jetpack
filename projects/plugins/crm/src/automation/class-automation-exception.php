<?php
/**
 * Defines Jetpack CRM Automation exceptions.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Exception class.
 *
 * @since 6.2.0
 */
class Automation_Exception extends \Exception {

	/**
	 * Step class not found code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const STEP_CLASS_NOT_FOUND = 10;

	/**
	 * Step slug exists code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const STEP_SLUG_EXISTS = 11;

	/**
	 * Step slug empty code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const STEP_SLUG_EMPTY = 12;

	/**
	 * Trigger class not found code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const TRIGGER_CLASS_NOT_FOUND = 20;

	/**
	 * Trigger slug exists code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const TRIGGER_SLUG_EXISTS = 21;

	/**
	 * Trigger slug empty code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const TRIGGER_SLUG_EMPTY = 22;

	/**
	 * Condition invalid operator code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const CONDITION_INVALID_OPERATOR = 30;

	/**
	 * Condition operator not implemented code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const CONDITION_OPERATOR_NOT_IMPLEMENTED = 31;

	/**
	 * General error code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const GENERAL_ERROR = 999;

	/**
	 * Automation_Exception constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param string $message Allows an exception message to be passed.
	 * @param int    $code The error code to be included in the exception output.
	 */
	public function __construct( $message = 'Automation Exception', $code = self::GENERAL_ERROR ) { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found
		parent::__construct( $message, $code );
	}
}
