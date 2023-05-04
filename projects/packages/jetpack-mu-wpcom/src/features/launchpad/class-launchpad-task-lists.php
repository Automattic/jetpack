<?php
/**
 * Launchpad Task Lists Registry
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.5.0
 */

/**
 * Launchpad Task List
 *
 * This file provides a Launchpad Task List class that manages the current list
 * of Launchpad checklists that are available to be used.
 *
 * @package automattic/jetpack-mu-wpcom
 */
class Launchpad_Task_Lists {
	/**
	 * Internal storage for registered Launchpad Task Lists
	 *
	 * @var Task_List[]
	 */
	private $task_list_registry = array();

	/**
	 * Internal storage for registered Launchpad Task Lists
	 *
	 * @var Task[]
	 */
	private $task_registry = array();

	/**
	 * Singleton instance
	 *
	 * @var Launchpad_Task_List
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance
	 *
	 * @return Launchpad_Task_Lists
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register a new Launchpad Task List
	 *
	 * @param Task_List $task_list Task List definition.
	 *
	 * @return bool True if successfully registered, false if not.
	 */
	public function register_task_list( $task_list = array() ) {
		if ( ! $this->validate_task_list( $task_list ) ) {
			return false;
		}

		$this->task_list_registry[ $task_list['id'] ] = $task_list;
		return true;
	}

	/**
	 * Register a new Launchpad Task
	 *
	 * @param Task $task Task definition.
	 *
	 * @return bool True if successful, false if not.
	 */
	public function register_task( $task = array() ) {
		if ( ! $this->validate_task( $task ) ) {
			return false;
		}
		// TODO: Handle duplicate tasks
		$this->task_registry[ $task['id'] ] = $task;
		return true;
	}

	/**
	 * Unregister a Launchpad Task List
	 *
	 * @param string $id Task List id.
	 *
	 * @return bool True if successfully unregistered, false if not found.
	 */
	public function unregister_task_list( $id ) {
		if ( ! array_key_exists( $id, $this->task_list_registry ) ) {
			return false;
		}

		unset( $this->task_list_registry[ $id ] );
		return true;
	}

	/**
	 * Unregister a Launchpad Task
	 *
	 * @param string $id Task id.
	 *
	 * @return bool True if successful, false if not.
	 */
	public function unregister_task( $id ) {
		if ( ! array_key_exists( $id, $this->task_registry ) ) {
			return false;
		}

		unset( $this->task_registry[ $id ] );
		return true;
	}

	/**
	 * Get a Launchpad Task List definition
	 *
	 * @param string $id Task List id.
	 *
	 * @return Task_List Task List.
	 */
	protected function get_task_list( $id ) {
		if ( ! array_key_exists( $id, $this->task_list_registry ) ) {
			return array();
		}

		return $this->task_list_registry[ $id ];
	}

	/**
	 * Get all registered Launchpad Task Lists.
	 *
	 * @return array All registered Launchpad Task Lists.
	 */
	public function get_all_task_lists() {
		return $this->task_list_registry;
	}

	/**
	 * Get a Launchpad Task definition
	 *
	 * @param string $id Task id.
	 *
	 * @return Task Task.
	 */
	public function get_task( $id ) {
		if ( ! array_key_exists( $id, $this->task_registry ) ) {
			return array();
		}

		return $this->task_registry[ $id ];
	}

	/**
	 * Get all registered Launchpad Tasks.
	 *
	 * @return array All registered Launchpad Tasks.
	 */
	public function get_all_tasks() {
		return $this->task_registry;
	}

	/**
	 * Builds a collection of tasks for a given task list
	 *
	 * @param string $id Task list id.
	 *
	 * @return Task[] Collection of tasks associated with a task list.
	 */
	public function build( $id ) {
		$task_list           = $this->get_task_list( $id );
		$tasks_for_task_list = array();

		// Takes a registered task list, looks at its associated task ids,
		// and returns a collection of associated tasks.
		foreach ( $task_list['task_ids'] as $task_id ) {
			$task_definition = $this->get_task( $task_id );

			// if task can't be found don't add anything
			if ( ! empty( $task_definition ) ) {
				$tasks_for_task_list[] = $this->build_task( $task_definition );
			}
		}

		return $tasks_for_task_list;
	}

	/**
	 * Builds a single task with current state
	 *
	 * @param Task $task Task definition.
	 * @return Task Task with current state.
	 */
	private function build_task( $task ) {
		$built_task                 = array(
			'id'    => $task['id'],
			'title' => $task['title'],
		);
		$built_task['completed']    = $this->is_task_complete( $task );
		$built_task['disabled']     = $this->is_task_disabled( $task );
		$built_task['subtitle']     = $this->load_subtitle( $task );
		$built_task['badge_text']   = $this->load_value_from_callback( $task, 'badge_text_callback' );
		$built_task['isLaunchTask'] = isset( $task['isLaunchTask'] ) ? $task['isLaunchTask'] : false;

		return $built_task;
	}

	/**
	 * Given a task definition and a possible callback, call it and return the value.
	 *
	 * @param Task   $task A task definition.
	 * @param string $callback The callback to attempt to call.
	 * @param mixed  $default The default value, passed to the callback if it exists.
	 * @return mixed The value returned by the callback, or the default value.
	 */
	private function load_value_from_callback( $task, $callback, $default = '' ) {
		if ( isset( $task[ $callback ] ) && is_callable( $task[ $callback ] ) ) {
			return call_user_func_array( $task[ $callback ], array( $task, $default ) );
		}
		return $default;
	}

	/**
	 * Loads a subtitle for a task, calling the callback if it exists.
	 *
	 * @param Task $task A task definition.
	 * @return string The subtitle for the task.
	 */
	private function load_subtitle( $task ) {
		$subtitle = $this->load_value_from_callback( $task, 'subtitle' );
		if ( ! empty( $subtitle ) ) {
			return $subtitle;
		}
		// if it wasn't a callback, but still a string, return it.
		if ( isset( $task['subtitle'] ) ) {
			$task['subtitle'];
		}
		return '';
	}

	/**
	 * Checks if a task is disabled
	 *
	 * @param array $task Task definition.
	 * @return boolean
	 */
	public function is_task_disabled( $task ) {
		return $this->load_value_from_callback( $task, 'is_disabled_callback', false );
	}

	/**
	 * Checks if a task is complete, relying on task-defined callbacks if available
	 *
	 * @param Task $task Task definition.
	 * @return boolean
	 */
	public function is_task_complete( $task ) {
		// First we calculate the value from our statuses option. This will get passed to the callback, if it exists.
		// Othewise there is the temptation for the callback to fall back to the option, which would cause infinite recursion
		// as it continues to calculate the callback which falls back to the option: ∞.
		$statuses    = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$key         = $this->get_task_key( $task );
		$is_complete = isset( $statuses[ $key ] ) ? $statuses[ $key ] : false;

		return (bool) $this->load_value_from_callback( $task, 'is_complete_callback', $is_complete );
	}

	/**
	 * Gets the task key, which is used to store and retrieve the task's status.
	 * Either the task's id_map or id is used.
	 *
	 * @param Task $task Task definition.
	 * @return string The task key to use.
	 */
	public function get_task_key( $task ) {
		return isset( $task['id_map'] ) ? $task['id_map'] : $task['id'];
	}

	/**
	 * Checks if a task wight given ID is complete.
	 *
	 * @param string $task_id The task ID.
	 * @return boolean
	 */
	public function is_task_id_complete( $task_id ) {
		$task = $this->get_task( $task_id );
		if ( empty( $task ) ) {
			return false;
		}
		return $this->is_task_complete( $task );
	}

	/**
	 * Validate a Launchpad Task List
	 *
	 * @param Task_List $task_list Task List.
	 *
	 * @return bool True if valid, false if not.
	 */
	public static function validate_task_list( $task_list ) {
		if ( ! is_array( $task_list ) ) {
			return false;
		}

		if ( ! isset( $task_list['id'] ) ) {
			_doing_it_wrong( 'validate_task_list', 'The Launchpad task list being registered requires a "id" attribute', '6.1' );
			return false;
		}

		if ( ! isset( $task_list['task_ids'] ) ) {
			_doing_it_wrong( 'validate_task_list', 'The Launchpad task list being registered requires a "task_ids" attribute', '6.1' );
			return false;
		}

		return true;
	}

	/**
	 * Adds task-defined `add_listener_callback` hooks for incomplete tasks.
	 *
	 * @param string $task_list_id Optional. Will default to `site_intent` option.
	 * @return void
	 */
	public function add_hooks_for_active_tasks( $task_list_id = null ) {
		// leave things alone if Launchpad is not enabled.
		if ( ! $this->is_launchpad_enabled() ) {
			return;
		}

		$task_list_id = $task_list_id ? $task_list_id : get_option( 'site_intent' );
		if ( ! $task_list_id ) {
			return;
		}
		$task_list = $this->get_task_list( $task_list_id );
		if ( empty( $task_list ) ) {
			return;
		}
		$built_tasks = $this->build( $task_list_id );
		// filter for incomplete tasks that have a callback
		$tasks_to_hook = wp_list_filter( $built_tasks, array( 'completed' => false ) );
		foreach ( $tasks_to_hook as $task ) {
			$task_definition = $this->get_task( $task['id'] );
			if ( isset( $task_definition['add_listener_callback'] ) && is_callable( $task_definition['add_listener_callback'] ) ) {
				call_user_func_array( $task_definition['add_listener_callback'], array( $task, $task_definition ) );
			}
		}
	}

	/**
	 * Marks a task as complete.
	 *
	 * @param string $task_id The task ID.
	 * @return bool True if successful, false if not.
	 */
	public function mark_task_complete( $task_id ) {
		$task = $this->get_task( $task_id );
		if ( empty( $task ) ) {
			return false;
		}
		$key              = $this->get_task_key( $task );
		$statuses         = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$statuses[ $key ] = true;

		// todo This is where we can disable launchpad if all tasks are complete.
		return update_option( 'launchpad_checklist_tasks_statuses', $statuses );
	}

	/**
	 * Validate a Launchpad Task
	 *
	 * @param Task $task Task.
	 *
	 * @return bool True if valid, false if not.
	 */
	public static function validate_task( $task ) {
		if ( ! is_array( $task ) ) {
			return false;
		}

		if ( ! isset( $task['id'] ) ) {
			_doing_it_wrong( 'validate_task', 'The Launchpad task being registered requires a "id" attribute', '6.1' );
			return false;
		}

		if ( ! isset( $task['title'] ) ) {
			_doing_it_wrong( 'validate_task', 'The Launchpad task being registered requires a "title" attribute', '6.1' );
			return false;
		}

		return true;
	}

	/**
	 * Checks if Launchpad is enabled.
	 *
	 * @return boolean
	 */
	private function is_launchpad_enabled() {
		$launchpad_screen = get_option( 'launchpad_screen' );
		// todo also check for incomplete tasks
		return 'full' === $launchpad_screen;
	}

}
