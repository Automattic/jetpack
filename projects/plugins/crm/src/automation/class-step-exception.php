<?php
/**
 * Defines the Jetpack CRM Automation step exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Step_Exception class.
 */
class Step_Exception extends \Exception {
	const STEP_TYPE_NOT_ALLOWED     = 10;
	const STEP_CLASS_DOES_NOT_EXIST = 11;
}
