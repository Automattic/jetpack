<?php
/**
 * Task Event.
 *
 * @package Automattic\Jetpack\CRM\Event_Manager
 */

namespace Automattic\Jetpack\CRM\Event_Manager;

/**
 * Task Event class.
 */
class Task_Event implements Event {

	/** @var null The Task_Event instance. */
	private static $instance = null;

	/**
	 * Get the singleton instance of this class.
	 *
	 * @return Task_Event
	 */
	public static function getInstance(): Task_Event {
		if ( ! self::$instance ) {
			self::$instance = new Task_Event();
		}

		return self::$instance;
	}

	/**
	 * A new task was created.
	 *
	 * @param array $task_data The created task data.
	 * @return void
	 */
	public function created( array $task_data ) {
		do_action( 'jpcrm_task_created', $task_data );
	}

	/**
	 * The task was updated.
	 *
	 * @param array $task_data Updated task data.
	 * @param array $old_task_data Old task data.
	 * @return void
	 */
	public function updated( array $task_data, array $old_task_data ) {

		// General update
		do_action( 'jpcrm_task_updated', $task_data );

		// Check for field changes for specific updates
		$changed_fields = array();
		foreach ( $task_data as $key => $value ) {
			if ( $value !== $old_task_data[ $key ] ) {
				$changed_fields[ $key ] = $value;

				do_action( 'jpcrm_task_field_updated_' . $key, $value, $old_task_data[ $key ] );
			}
		}
	}

	/**
	 * A task was deleted.
	 *
	 * @param array $task_data The deleted task data.
	 * @return void
	 */
	public function deleted( array $task_data ) {
		do_action( 'jpcrm_task_deleted', $task_data );
	}
}
