<?php
/**
 * Interface Trigger
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Interface Trigger.
 *
 * @package Automattic\Jetpack\CRM\Automation
 */
interface Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @return string
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the trigger.
	 *
	 * @return string
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the trigger.
	 *
	 * @return string
	 */
	public static function get_description(): ?string;

	/**
	 * Get the category of the trigger.
	 *
	 * @return string
	 */
	public static function get_category(): ?string;

	/**
	 * Execute the workflow.
	 *
	 * @param array|null $data The data to pass to the workflow.
	 */
	public function execute_workflow( array $data = null );

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow );

	/**
	 * Init the trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 */
	public function init( Automation_Workflow $workflow );

}
