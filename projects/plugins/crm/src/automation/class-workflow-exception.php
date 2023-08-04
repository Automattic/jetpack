<?php
/**
 * Defines the Jetpack CRM Automation workflow exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Workflow_Exception class.
 *
 * @since $$next-version$$
 */
class Workflow_Exception extends \Exception {
	/**
	 * Invalid Workflow error code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const INVALID_WORKFLOW = 10;
	/**
	 * Workflow require a trigger error code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const WORKFLOW_REQUIRE_A_TRIGGER = 11;
	/**
	 * Workflow require a initial step error code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const WORKFLOW_REQUIRE_A_INITIAL_STEP = 12;
	/**
	 * Error initializing trigger error code.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const ERROR_INITIALIZING_TRIGGER = 13;
}
