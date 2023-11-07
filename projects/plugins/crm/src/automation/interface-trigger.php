<?php
/**
 * Interface Trigger
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Interface Trigger.
 *
 * @since 6.2.0
 */
interface Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string;

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The title of the trigger.
	 */
	public static function get_title(): ?string;

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The description of the trigger.
	 */
	public static function get_description(): ?string;

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The category of the trigger.
	 */
	public static function get_category(): ?string;

	/**
	 * Get the trigger's data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string the trigger's data type.
	 */
	public static function get_data_type(): string;

	/**
	 * Execute the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param mixed|null $data The data to pass to the workflow.
	 * @param mixed|null $previous_data The previous data to pass to the workflow.
	 */
	public function execute_workflow( $data = null, $previous_data = null );

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow );

	/**
	 * Init the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 */
	public function init( Automation_Workflow $workflow );

	/**
	 * Get the trigger as an array.
	 *
	 * The main use-case to get the trigger as an array is to prepare
	 * the items for an API response.
	 *
	 * @since 6.2.0
	 *
	 * @return array The trigger as an array.
	 */
	public static function to_array(): array;
}
