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
	 * @param array $task_list Task List definition.
	 *
	 * @return bool True if successfully registered.
	 */
	public function register_task_list( $task_list = array() ) {
		if ( ! $this->validate_task_list( $task_list ) ) {
			return false;
		}

		$this->task_list_registry[] = array( $task_list['slug'] => $task_list );
		return true;
	}

	/**
	 * Register a new Launchpad Task
	 *
	 * @param array $task Task definition.
	 *
	 * @return bool True if successful, false if not.
	 */
	public function register_task( $task = array() ) {
		if ( ! $this->validate_task( $task ) ) {
			return false;
		}

		// TODO: Handle duplicate tasks
		$this->task_registry[] = array( $task['slug'] => $task );
		return true;
	}

	/**
	 * Register a new Launchpad Task
	 *
	 * @param array $tasks Collection of task definitions.
	 *
	 * @return bool True if successful, false if not.
	 */
	public function register_tasks( $tasks = array() ) {
		foreach ( $tasks as $task ) {
			if ( ! $this->validate_task( $task ) ) {
				return false;
			}
		}

		// TODO: Handle duplicate tasks
		array_merge( $this->task_registry, $tasks );
		return true;
	}

	/**
	 * Unregister a Launchpad Task List
	 *
	 * @param string $slug Task List slug.
	 *
	 * @return bool  True if successfully unregistered, false if not found.
	 */
	public function unregister_task_list( $slug ) {
		if ( ! array_key_exists( $this->task_list_registry, $slug ) ) {
			return false;
		}

		unset( $this->task_list_registry[ $slug ] );
		return true;
	}

	/**
	 * Unregister a Launchpad Task
	 *
	 * @param string $slug Task slug.
	 *
	 * @return bool  True if successful, false if not.
	 */
	public function unregister_task( $slug ) {
		if ( ! array_key_exists( $this->task_registry, $slug ) ) {
			return false;
		}

		unset( $this->task_registry[ $slug ] );
		return true;
	}

	/**
	 * Get a Launchpad Task List
	 *
	 * @param string $id Task List slug.
	 *
	 * @return array Task List arguments.
	 */
	public function get_task_list( $id ) {
		if ( ! array_key_exists( $this->task_list_registry, $id ) ) {
			return array();
		}

		return $this->task_list_registry[ $id ];
	}

	/**
	 * Register a new Launchpad Task
	 *
	 * @param string $slug Task list slug.
	 *
	 * @return array Task List with tasks added
	 */
	public function build( $slug ) {
		$task_list = this->get_task_list( $slug );
		if ( ! array_key_exists( $this->task_list_registry, $slug ) ) {
			return array();
		}

		$task_list = $this->task_list_registry[ $slug ];
		$result    = array();

		foreach ( $task_list['task_ids'] as $key => $value ) {
			$result [] = $this->task_registry[ $key ];
		}

		return $result;
	}

	/**
	 * Validate a Launchpad Task List
	 *
	 * @param array $task_list Task List arguments.
	 *
	 * @return bool True if valid, false if not.
	 */
	public static function validate_task_list( $task_list ) {
		if ( ! is_array( $task_list ) ) {
			return false;
		}

		if ( ! isset( $task_list['slug'] ) ) {
			return false;
		}

		if ( ! isset( $task_list['title'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Validate a Launchpad Task
	 *
	 * @param array $task Task arguments.
	 *
	 * @return bool True if valid, false if not.
	 */
	public static function validate_task( $task ) {
		if ( ! is_array( $task ) ) {
			return false;
		}

		if ( ! isset( $task['slug'] ) ) {
			return false;
		}

		if ( ! isset( $task['title'] ) ) {
			return false;
		}

		if ( ! isset( $task['completed'] ) ) {
			return false;
		}

		if ( ! isset( $args['disabled'] ) ) {
			return false;
		}

		return true;
	}

}
