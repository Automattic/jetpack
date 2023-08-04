<?php
/**
 * Defines the Jetpack CRM Automation workflow exception.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Workflow_Exception class.
 *
 * @since $$next-version$$
 */
class Workflow_Exception extends \Exception {
	const INVALID_WORKFLOW                = 10;
	const WORKFLOW_REQUIRE_A_TRIGGER      = 11;
	const WORKFLOW_REQUIRE_A_INITIAL_STEP = 12;
	const ERROR_INITIALIZING_TRIGGER      = 13;
}
