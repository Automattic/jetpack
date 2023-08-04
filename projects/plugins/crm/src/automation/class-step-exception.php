<?php
/**
 * Defines the Jetpack CRM Automation step exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Step_Exception class.
 *
 * @since $$next-version$$
 */
class Step_Exception extends \Exception {
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
	const STEP_CLASS_DOES_NOT_EXIST = 11;
}
