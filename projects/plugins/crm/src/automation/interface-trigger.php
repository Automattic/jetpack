<?php
/**
 * Interface Trigger
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Interface Trigger.
 *
 * @since $$next-version$$
 */
interface Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): ?string;

	/**
	 * Get the category of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): ?string;

	/**
	 * Get the trigger's data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string the trigger's data type.
	 */
	public static function get_data_type(): string;

	/**
	 * Execute the workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $data The data to pass to the workflow.
	 */
	public function execute_workflow( $data = null );

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow );

	/**
	 * Init the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 */
	public function init( Automation_Workflow $workflow );

}
