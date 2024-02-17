<?php
/**
 * Defines the Jetpack CRM Automation workflow exception.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Workflow_Exception class.
 *
 * @since 6.2.0
 */
class Workflow_Exception extends \Exception {

	/**
	 * Invalid Workflow error code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const INVALID_WORKFLOW = 10;

	/**
	 * Workflow require a trigger error code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const WORKFLOW_REQUIRE_A_TRIGGER = 11;

	/**
	 * Workflow require an initial step error code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const WORKFLOW_REQUIRE_A_INITIAL_STEP = 12;

	/**
	 * Error initializing trigger error code.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const ERROR_INITIALIZING_TRIGGER = 13;

	/**
	 * Missing engine instance.
	 *
	 * This exception should be thrown if a workflow is attempted to be executed without an engine instance.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const MISSING_ENGINE_INSTANCE = 14;

	/**
	 * Failed to insert the workflow.
	 *
	 * This exception should be thrown in the context of CRUD action(s).
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const FAILED_TO_INSERT = 50;

	/**
	 * Failed to update the workflow.
	 *
	 * This exception should be thrown in the context of CRUD action(s).
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const FAILED_TO_UPDATE = 51;

	/**
	 * Failed to delete the workflow.
	 *
	 * This exception should be thrown in the context of CRUD action(s).
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const FAILED_TO_DELETE = 52;
}
