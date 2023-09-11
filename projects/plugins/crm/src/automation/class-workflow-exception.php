<?php
/**
 * Defines the Jetpack CRM Automation workflow exception.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
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
	 * Workflow require an initial step error code.
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

	/**
	 * Missing engine instance.
	 *
	 * This exception should be thrown if a workflow is attempted to be executed without an engine instance.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const MISSING_ENGINE_INSTANCE = 14;

}
