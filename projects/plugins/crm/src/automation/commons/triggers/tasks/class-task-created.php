<?php
/**
 * Jetpack CRM Automation Task_Created trigger.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Task_Data;

/**
 * Adds the Task_Created class.
 *
 * @since 6.2.0
 */
class Task_Created extends Base_Trigger {

	/**
	 * Get the slug name of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the trigger.
	 */
	public static function get_slug(): string {
		return 'jpcrm/task_created';
	}

	/**
	 * Get the title of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title of the trigger.
	 */
	public static function get_title(): string {
		return __( 'New Task', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description of the trigger.
	 */
	public static function get_description(): string {
		return __( 'Triggered when a new task status is added', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the trigger.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category of the trigger.
	 */
	public static function get_category(): string {
		return __( 'Task', 'zero-bs-crm' );
	}

	/**
	 * Get the date type.
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Task_Data::class;
	}

	/**
	 * Listen to this trigger's target event.
	 *
	 * @since 6.2.0
	 * @return void
	 */
	protected function listen_to_event(): void {
		$this->listen_to_wp_action( 'jpcrm_task_created' );
	}
}
