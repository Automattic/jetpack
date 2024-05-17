<?php
/**
 * Defines the Jetpack CRM Automation step exception.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Step_Exception class.
 *
 * @since 6.2.0
 */
class Step_Exception extends Automation_Exception {

	/**
	 * Step type not allowed code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const STEP_TYPE_NOT_ALLOWED = 10;

	/**
	 * Step class does not exist code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const DO_NOT_EXIST = 11;

	/**
	 * Step class do not extend base class or interface.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const DO_NOT_EXTEND_BASE = 12;
}
