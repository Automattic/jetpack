<?php
/**
 * Defines the Jetpack CRM Automation step exception.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Step_Exception class.
 *
 * @since $$next-version$$
 */
class Step_Exception extends Automation_Exception {

	/**
	 * Step type not allowed code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const STEP_TYPE_NOT_ALLOWED = 10;

	/**
	 * Step class does not exist code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const DO_NOT_EXIST = 11;

	/**
	 * Step class do not extend base class or interface.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const DO_NOT_EXTEND_BASE = 12;

}
