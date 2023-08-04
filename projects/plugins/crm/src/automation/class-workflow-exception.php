<?php
/**
 * Defines the Jetpack CRM Automation workflow exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Workflow_Exception class.
 */
class Workflow_Exception extends \Exception {
	const INVALID_WORKFLOW                = 10;
	const WORKFLOW_REQUIRE_A_TRIGGER      = 11;
	const WORKFLOW_REQUIRE_A_INITIAL_STEP = 12;
	const ERROR_INITIALIZING_TRIGGER      = 13;

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
