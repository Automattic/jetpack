<?php
/**
 * Jetpack CRM Automation Task_Updated trigger.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Task;

/**
 * Adds the Task_Updated class.
 *
 * @since $$next-version$$
 */
class Task_Updated extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The trigger slug.
	 */
	public static function get_slug(): string {
		return 'jpcrm/task_updated';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title.
	 */
	public static function get_title(): string {
		return __( 'Task Updated', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a task is updated', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category.
	 */
	public static function get_category(): string {
		return __( 'Task', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step
	 */
	public static function get_data_type(): string {
		return Data_Type_Task::get_slug();
	}

	/**
	 * Listen to this trigger's target event.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	protected function listen_to_event() {
		add_action(
			'jpcrm_task_updated',
			array( $this, 'execute_workflow' )
		);
	}
}
