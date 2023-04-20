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
	 * @var array
	 */
	private $registry = array();

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
	 * @param string $slug Task List slug.
	 * @param array  $args Task List arguments.
	 *
	 * @return bool  True if successfully registered.
	 */
	public function register_task_list( $slug, $args ) {
		if ( ! self::validate_task_list( $args ) ) {
			return false;
		}

		self::$registry = array_merge(
			$this->registry,
			array( $slug => $args )
		);
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
		if ( ! isset( self::$registry[ $slug ] ) ) {
			return false;
		}

		unset( self::$registry[ $slug ] );
		return true;
	}

	/**
	 * Get a Launchpad Task List
	 *
	 * @param string $slug Task List slug.
	 *
	 * @return array Task List arguments.
	 */
	public function get_task_list( $slug ) {
		if ( ! array_key_exists( self::$registry, $slug ) ) {
			return array();
		}

		return self::$registry[ $slug ];
	}

	/**
	 * Register a new Launchpad Task
	 *
	 * @param string $task_list_slug Task list slug.
	 * @param array  $args Task List arguments.
	 *
	 * @return bool  True if successful
	 */
	public function register_task( $task_list_slug, $args = array() ) {
		if ( ! self::validate_task( $args ) ) {
			return false;
		}

		if ( ! array_key_exists( self::$registry, $task_list_slug ) ) {
			return false;
		}

		self::$registry[ $task_list_slug ] = array_push( self::$registry[ $task_list_slug ], $args );
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

		if ( ! isset( $task['id'] ) ) {
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
