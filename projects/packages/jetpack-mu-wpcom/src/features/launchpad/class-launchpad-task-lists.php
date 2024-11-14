<?php
/**
 * Launchpad Task Lists Registry
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.5.0
 */

// Type aliases used in a bunch of places in this file. Unfortunately Phan doesn't have a way to set these more globally than copy-pasting them into each file needing them.
<<<PHAN
@phan-type Task_List = array{id:string, task_ids:string[], required_task_ids?:string[], visible_tasks_callback?:callable, require_last_task_completion?:bool, get_title?:callable, is_dismissible?:bool, is_enabled_callback?:callable}
@phan-type Task = array{id:string, title?:string, get_title?:callable, id_map?:string, add_listener_callback?:callable, badge_text_callback?:callable, extra_data_callback?:callable, get_calypso_path?:callable, is_complete_callback?:callable, is_disabled_callback?:callable, isLaunchTask?:bool, is_visible_callback?:callable, target_repetitions?:int, repetition_count_callback?:callable, subtitle?:callable, completed?:bool}
PHAN;

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
	 * Internal reference for the current site slug.
	 *
	 * @var string|null
	 */
	private $site_slug = null;

	/**
	 * Singleton instance
	 *
	 * @var Launchpad_Task_Lists
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
		if ( self::validate_task_list( $task_list ) !== null ) {
			return false;
		}

		// If no is_completed_callback is set, use the default.
		if ( ! isset( $task_list['is_completed_callback'] ) ) {
			$task_list['is_completed_callback'] = 'wpcom_default_launchpad_task_list_completed';
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
		if ( ! static::validate_task( $task ) ) {
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
	 * Check if a task list is enabled by checking its is_enabled_callback callback.
	 *
	 * @param string $id Task List id.
	 * @return bool|null True if enabled, false if not, null if not found.
	 */
	public function is_task_list_enabled( $id ) {
		$task_list = $this->get_task_list( $id );

		return $this->load_value_from_callback( $task_list, 'is_enabled_callback', null );
	}

	/**
	 * Check if a task list was dismissed by the user.
	 *
	 * @param string $id Task List id.
	 * @return bool|null True if dismissed, false if not.
	 */
	public function is_task_list_dismissed( $id ) {
		$task_list_dismissed_status = $this->get_task_list_dismissed_status();
		$is_dismissed               = isset( $task_list_dismissed_status[ $id ] ) && true === $task_list_dismissed_status[ $id ];

		// Return true if the task list is on the dismissed status array and its value is true.
		return $is_dismissed || $this->is_temporally_dismissed( $id );
	}

	/**
	 * Check if a task list is dismissible.
	 *
	 * @param string $id Task List id.
	 * @return bool True if dismissible, false if not.
	 */
	public function is_task_list_dismissible( $id ) {
		$task_list = $this->get_task_list( $id );
		if ( ! isset( $task_list['is_dismissible'] ) ) {
			return false;
		}
		return $task_list['is_dismissible'];
	}

	/**
	 * Set wether a task list is dismissed or not for a site.
	 *
	 * @param string $id Task List id.
	 * @param bool   $is_dismissed True if dismissed, false if not.
	 */
	public function set_task_list_dismissed( $id, $is_dismissed ) {
		$task_list        = $this->get_task_list( $id );
		$launchpad_config = get_option( 'wpcom_launchpad_config', array() );

		if ( empty( $id ) || empty( $task_list ) ) {
			return;
		}

		$task_list_dismissed_status = $this->get_task_list_dismissed_status();
		$is_dismissed               = (bool) $is_dismissed;

		if ( $is_dismissed ) {
			$task_list_dismissed_status[ $id ] = true;
		} else {
			unset( $task_list_dismissed_status[ $id ] );
		}

		$launchpad_config['task_list_dismissed_status'] = $task_list_dismissed_status;
		update_option( 'wpcom_launchpad_config', $launchpad_config );
	}

	/**
	 * Set the date until a task list is dismissed.
	 *
	 * @param string $checklist_slug Checklist slug.
	 * @param int    $dismissed_until Timestamp with the date until the task list is dismissed.
	 */
	public function set_task_list_dismissed_until( $checklist_slug, $dismissed_until ) {

		if ( empty( $checklist_slug ) ) {
			return;
		}

		$task_list_dismissed_until = $this->get_task_list_dismissed_until();

		if ( isset( $dismissed_until ) ) {
			$task_list_dismissed_until[ $checklist_slug ] = $dismissed_until;
		} else {
			unset( $task_list_dismissed_until[ $checklist_slug ] );
		}

		$launchpad_config                              = get_option( 'wpcom_launchpad_config', array() );
		$launchpad_config['task_list_dismissed_until'] = $task_list_dismissed_until;

		update_option( 'wpcom_launchpad_config', $launchpad_config );
	}

	/**
	 * Returns true if the task list is temporally dismissed.
	 *
	 * @param string $checklist_slug Checklist slug.
	 * @return bool True if temporally dismissed, false if not.
	 */
	protected function is_temporally_dismissed( $checklist_slug ): bool {
		$task_list_dismissed_until = $this->get_task_list_dismissed_until();

		if ( ! isset( $task_list_dismissed_until ) || ! isset( $task_list_dismissed_until[ $checklist_slug ] ) ) {
			return false;
		}

		$task_list_dismissed_until = $task_list_dismissed_until[ $checklist_slug ];
		$current_time              = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
		$dismissed_until           = new DateTime( '@' . $task_list_dismissed_until, new DateTimeZone( 'UTC' ) );

		return $current_time <= $dismissed_until;
	}

	/**
	 * Get the task list visibility status for a site.
	 *
	 * @return array
	 */
	protected function get_task_list_dismissed_status() {
		$launchpad_config = get_option( 'wpcom_launchpad_config', array() );
		if ( ! isset( $launchpad_config['task_list_dismissed_status'] ) || ! is_array( $launchpad_config['task_list_dismissed_status'] ) ) {
			return array();
		}

		return $launchpad_config['task_list_dismissed_status'];
	}

	/**
	 * Get the task list dismissed until date when available.
	 *
	 * @return array
	 */
	public function get_task_list_dismissed_until() {
		$launchpad_config = get_option( 'wpcom_launchpad_config', array() );

		if ( ! isset( $launchpad_config['task_list_dismissed_until'] ) || ! is_array( $launchpad_config['task_list_dismissed_until'] ) ) {
			return array();
		}

		return $launchpad_config['task_list_dismissed_until'];
	}

	/**
	 * See if the task list registry has any task lists.
	 *
	 * @return bool True if there are task lists, false if not.
	 */
	public function has_task_lists() {
		return is_countable( $this->task_list_registry ) && count( $this->task_list_registry ) > 0;
	}

	/**
	 * Get all registered Launchpad Task Lists.
	 *
	 * @return Task_List[] All registered Launchpad Task Lists.
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
	 * Get the required task ids for a given task list.
	 *
	 * @param string $task_list_id Task list ID.
	 * @return array Required task ids.
	 */
	public function get_required_task_ids( $task_list_id ) {
		$task_list = $this->get_task_list( $task_list_id );
		if ( ! isset( $task_list['required_task_ids'] ) ) {
			return array();
		}
		return $task_list['required_task_ids'];
	}

	/**
	 * Check if the task list requires the last task to be completed in order to consider
	 * the task list complete.
	 *
	 * @param string $task_list_id Task list id.
	 * @return bool True if the last task must be completed, false if not.
	 */
	public function get_require_last_task_completion( $task_list_id ) {
		$task_list = $this->get_task_list( $task_list_id );
		if ( ! isset( $task_list['require_last_task_completion'] ) ) {
			return false;
		}
		return $task_list['require_last_task_completion'];
	}

	/**
	 * Check if a task list is completed.
	 *
	 * @param string $task_list_id Task list id.
	 * @return bool True if the task list is completed, false if not.
	 */
	public function is_task_list_completed( $task_list_id ) {
		$task_list = $this->get_task_list( $task_list_id );
		return $this->load_value_from_callback( $task_list, 'is_completed_callback', false );
	}

	/**
	 * Get all registered Launchpad Tasks.
	 *
	 * @return Task[] All registered Launchpad Tasks.
	 */
	public function get_all_tasks() {
		return $this->task_registry;
	}

	/**
	 * Builds a collection of tasks for a given task list
	 *
	 * @param string      $id Task list id.
	 * @param string|null $launchpad_context Optional. Screen in which launchpad is loading.
	 *
	 * @return Task[] Collection of tasks associated with a task list.
	 */
	public function build( $id, $launchpad_context = null ) {
		$task_list           = $this->get_task_list( $id );
		$tasks_for_task_list = array();

		if ( empty( $task_list['task_ids'] ) ) {
			return $tasks_for_task_list;
		}

		// Filter the task list's task ids to only include visible tasks if a callback is provided.
		$task_ids = $this->load_value_from_callback( $task_list, 'visible_tasks_callback', $task_list['task_ids'] );

		// Takes a registered task list, looks at its associated task ids,
		// and returns a collection of associated tasks.
		foreach ( $task_ids as $task_id ) {
			$task_definition = $this->get_task( $task_id );

			// if task can't be found don't add anything
			if ( $this->is_visible( $task_definition ) ) {
				$tasks_for_task_list[] = $this->build_task( $task_definition, $launchpad_context );
			}
		}

		return $tasks_for_task_list;
	}

	/**
	 * Allows a function to be called to determine if a task should be visible.
	 * For instance: we don't even want to show the verify_email task if it's already done.
	 *
	 * @param Task $task_definition A task definition.
	 * @return boolean True if task is visible, false if not.
	 */
	protected function is_visible( $task_definition ) {
		if ( empty( $task_definition ) ) {
			return false;
		}

		return $this->load_value_from_callback( $task_definition, 'is_visible_callback', true );
	}

	/**
	 * Builds a single task with current state
	 *
	 * @param Task        $task Task definition.
	 * @param string|null $launchpad_context Optional. Screen where Launchpad is loading.
	 * @return Task Task with current state.
	 */
	private function build_task( $task, $launchpad_context = null ) {
		$built_task = array(
			'id' => $task['id'],
		);

		$built_task['title']        = $this->load_title( $task );
		$built_task['completed']    = $this->is_task_complete( $task );
		$built_task['disabled']     = $this->is_task_disabled( $task );
		$built_task['subtitle']     = $this->load_subtitle( $task );
		$built_task['badge_text']   = $this->load_value_from_callback( $task, 'badge_text_callback' );
		$built_task['isLaunchTask'] = isset( $task['isLaunchTask'] ) ? $task['isLaunchTask'] : false;
		$extra_data                 = $this->load_extra_data( $task );

		if ( is_array( $extra_data ) && array() !== $extra_data ) {
			$built_task['extra_data'] = $extra_data;
		}

		if ( isset( $task['target_repetitions'] ) ) {
			$built_task['target_repetitions'] = $task['target_repetitions'];
			$built_task['repetition_count']   = min( $this->load_repetition_count( $task ), $task['target_repetitions'] );
		}

		if ( isset( $task['get_calypso_path'] ) ) {
			$calypso_path = $this->load_calypso_path( $task, $launchpad_context );

			if ( ! empty( $calypso_path ) ) {
				$built_task['calypso_path'] = $calypso_path;
			}
		}

		return $built_task;
	}

	/**
	 * Given a task or task list definition and a possible callback, call it and return the value.
	 *
	 * @param Task|Task_List $item     The task or task list definition.
	 * @param string         $callback The callback to attempt to call.
	 * @param mixed          $default  The default value, passed to the callback if it exists.
	 * @param array          $data     Any additional data specific to the callback.
	 * @return mixed The value returned by the callback, or the default value.
	 */
	private function load_value_from_callback( $item, $callback, $default = '', $data = array() ) {
		if ( isset( $item[ $callback ] ) && is_callable( $item[ $callback ] ) ) {
			return call_user_func_array( $item[ $callback ], array( $item, $default, $data ) );
		}
		return $default;
	}

	/**
	 * Loads any extra data for a task, calling the `extra_data_callback` callback to get the data if the callback is defined.
	 * Returns null if there is no callback or the callback returns an empty array or a non-array.
	 *
	 * @param Task $task A task definition.
	 * @return array|null The extra data for the task.
	 */
	private function load_extra_data( $task ) {
		$extra_data = $this->load_value_from_callback( $task, 'extra_data_callback' );
		if ( is_array( $extra_data ) && array() !== $extra_data ) {
			return $extra_data;
		}

		return null;
	}

	/**
	 * Loads a title for a task, calling the 'get_title' callback if it exists,
	 * or falling back on the value for the 'title' key if it is set.
	 * We prefer the callback so we can defer the translation until after the
	 * user's locale has been set up.
	 *
	 * @param Task $task A task definition.
	 * @return string The title for the task.
	 */
	private function load_title( $task ) {
		$title = $this->load_value_from_callback( $task, 'get_title' );
		if ( ! empty( $title ) ) {
			return $title;
		}

		if ( isset( $task['title'] ) ) {
			return $task['title'];
		}

		return '';
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
	 * Loads the repetition count for a task, calling the callback if it exists.
	 *
	 * @param Task $task A task definition.
	 * @return int|null The repetition count for the task.
	 */
	private function load_repetition_count( $task ) {
		return $this->load_value_from_callback( $task, 'repetition_count_callback', 0 );
	}

	/**
	 * Helper function to load the Calypso path for a task.
	 *
	 * @param Task        $task A task definition.
	 * @param string|null $launchpad_context Optional. Screen where Launchpad is loading.
	 * @return string|null
	 */
	private function load_calypso_path( $task, $launchpad_context = null ) {
		if ( null === $this->site_slug ) {
			$this->site_slug = wpcom_get_site_slug();
		}

		$data = array(
			'site_slug'         => $this->site_slug,
			'site_slug_encoded' => rawurlencode( $this->site_slug ),
			'launchpad_context' => $launchpad_context,
		);

		$calypso_path = $this->load_value_from_callback( $task, 'get_calypso_path', null, $data );

		if ( ! is_string( $calypso_path ) ) {
			return null;
		}

		if ( ! $this->is_valid_admin_url_or_absolute_path( $calypso_path ) ) {
			return null;
		}

		return $calypso_path;
	}

	/**
	 * Checks if a string is a Stripe connection, valid admin URL, or absolute path.
	 *
	 * @param string $input The string to check.
	 * @return boolean
	 */
	private function is_valid_admin_url_or_absolute_path( $input ) {
		// Allow Stripe connection URLs for `set_up_payments` task.
		if ( strpos( $input, 'https://connect.stripe.com' ) === 0 ) {
			return true;
		}

		// Checks if the string is URL starting with the admin URL.
		if ( strpos( $input, admin_url() ) === 0 ) {
			return true;
		}

		// Require that the string start with a slash, but not two slashes.
		if ( str_starts_with( $input, '/' ) && ! str_starts_with( $input, '//' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if a task is disabled
	 *
	 * @param Task $task Task definition.
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
	 * @return null|WP_Error Null if valid, WP_Error if not.
	 */
	public static function validate_task_list( $task_list ) {
		$error_code     = 'validate_task_list';
		$error_messages = array();

		if ( ! is_array( $task_list ) ) {
			// Ensure we have a valid task list array.
			$msg = 'Invalid task list';
			_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
			return new WP_Error( $error_code, $msg );
		}

		if ( ! isset( $task_list['id'] ) ) {
			// Ensure we have an id.
			$msg = 'The Launchpad task list being registered requires a "id" attribute';
			_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
			$error_messages[] = $msg;
		}

		if ( ! isset( $task_list['task_ids'] ) ) {
			// Ensure we have task_ids.
			$msg = 'The Launchpad task list being registered requires a "task_ids" attribute';
			_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
			$error_messages[] = $msg;
		} elseif ( isset( $task_list['required_task_ids'] ) ) {
			// Ensure we have a valid array.
			if ( ! is_array( $task_list['required_task_ids'] ) ) {
				$msg = 'The required_task_ids attribute must be an array';
				_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
				$error_messages[] = $msg;
				// Ensure all required tasks actually exist in the task list - we need the value to be an array for this to work.
			} elseif ( array_intersect( $task_list['required_task_ids'], $task_list['task_ids'] ) !== $task_list['required_task_ids'] ) {
				$msg = 'The required_task_ids must be a subset of the task_ids';
				_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
				$error_messages[] = $msg;
			}
		}

		if ( isset( $task_list['visible_tasks_callback'] ) && ! is_callable( $task_list['visible_tasks_callback'] ) ) {
			$msg = 'The visible_tasks_callback attribute must be callable';
			_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
			$error_messages[] = $msg;
		}

		if ( isset( $task_list['require_last_task_completion'] ) && ! is_bool( $task_list['require_last_task_completion'] ) ) {
			$msg = 'The require_last_task_completion attribute must be a boolean';
			_doing_it_wrong( 'validate_task_list', esc_html( $msg ), '6.1' );
			$error_messages[] = $msg;
		}

		if ( array() !== $error_messages ) {
			$wp_error = new WP_Error();

			foreach ( $error_messages as $error_message ) {
				$wp_error->add( $error_code, $error_message );
			}

			return $wp_error;
		}

		return null;
	}

	/**
	 * Get currently active tasks.
	 *
	 * @param string $task_list_id Optional. Will default to `site_intent` option.
	 * @return Task[] Array of active tasks.
	 */
	private function get_active_tasks( $task_list_id = null ) {
		$task_list_id = $task_list_id ? $task_list_id : get_option( 'site_intent' );
		if ( ! $task_list_id ) {
			return array();
		}
		$task_list = $this->get_task_list( $task_list_id );
		if ( empty( $task_list ) ) {
			return array();
		}
		$built_tasks = $this->build( $task_list_id );
		// filter for incomplete tasks
		return wp_list_filter( $built_tasks, array( 'completed' => false ) );
	}

	/**
	 * Gets a list of completed tasks.
	 *
	 * @param string $task_list_id Optional. Will default to `site_intent` option.
	 * @return Task[] Array of completed tasks.
	 */
	private function get_completed_tasks( $task_list_id = null ) {
		$task_list_id = $task_list_id ? $task_list_id : get_option( 'site_intent' );
		if ( ! $task_list_id ) {
			return array();
		}
		$task_list = $this->get_task_list( $task_list_id );
		if ( empty( $task_list ) ) {
			return array();
		}
		$built_tasks = $this->build( $task_list_id );
		// filter for incomplete tasks
		return wp_list_filter( $built_tasks, array( 'completed' => true ) );
	}

	/**
	 * Checks if there are any active tasks.
	 *
	 * @param string|null $task_list_id Optional. Will default to `site_intent` option.
	 * @return boolean True if there are active tasks, false if not.
	 */
	private function has_active_tasks( $task_list_id = null ) {
		return ! empty( $this->get_active_tasks( $task_list_id ) );
	}

	/**
	 * Adds task-defined `add_listener_callback` hooks for incomplete tasks.
	 *
	 * @param string $task_list_id Optional. Will default to `site_intent` option.
	 * @return void
	 */
	public function add_hooks_for_active_tasks( $task_list_id = null ) {
		// leave things alone if Launchpad is not enabled.
		if ( ! $this->is_fullscreen_launchpad_enabled() ) {
			return;
		}

		$task_list_id = $task_list_id ? $task_list_id : get_option( 'site_intent' );
		// Sites without a `site_intent` option will not have any tasks.
		if ( ! $task_list_id ) {
			return;
		}

		$task_list = $this->get_task_list( $task_list_id );
		if ( empty( $task_list ) || ! isset( $task_list['task_ids'] ) ) {
			return;
		}

		foreach ( $task_list['task_ids'] as $task_id ) {
			$task_definition = $this->get_task( $task_id );
			if ( isset( $task_definition['add_listener_callback'] ) && is_callable( $task_definition['add_listener_callback'] ) ) {
				// We only need to know the built completion status if the task has an `add_listener_callback` property.
				// Small optimization to not run `is_complete_callback` as often.
				$task = $this->build_task( $task_definition );
				if ( ! $task['completed'] && is_callable( $task_definition['add_listener_callback'] ) ) {
					call_user_func_array( $task_definition['add_listener_callback'], array( $task, $task_definition ) );
				}
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
		$result = wpcom_mark_launchpad_task_complete( $task_id );

		$this->maybe_disable_fullscreen_launchpad();

		return $result;
	}

	/**
	 * Marks a task as complete if it is active for this site. This is a bit of a hacky way to be able to share a callback
	 * among several tasks, calling several completion IDs from the same callback.
	 *
	 * @param string $task_id The task ID.
	 * @return bool True if successful, false if not.
	 */
	public function mark_task_complete_if_active( $task_id ) {
		// Ensure that the task is an active one
		$active_tasks_by_task_id = wp_list_filter( $this->get_active_tasks(), array( 'id' => $task_id ) );
		if ( empty( $active_tasks_by_task_id ) ) {
			return false;
		}

		return $this->mark_task_complete( $task_id );
	}

	/**
	 * Disables fullscreen Launchpad if all tasks are complete.
	 *
	 * @return void
	 */
	public function maybe_disable_fullscreen_launchpad() {
		$completed_site_launched_task = wp_list_filter(
			$this->get_completed_tasks(),
			array(
				'isLaunchTask' => true,
			)
		);

		$site_launched = ! empty( $completed_site_launched_task );

		if ( $site_launched || ! $this->has_active_tasks() ) {
			$this->disable_fullscreen_launchpad();
		}
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

		// For now, allow the 'title' attribute.
		$has_valid_title = isset( $task['title'] ) || ( isset( $task['get_title'] ) && is_callable( $task['get_title'] ) );

		if ( ! $has_valid_title ) {
			_doing_it_wrong( 'validate_task', 'The Launchpad task being registered requires a "title" attribute or a "get_title" callback', '6.2' );
			return false;
		}

		$has_any_repetition_properties  = isset( $task['target_repetitions'] ) || isset( $task['repetition_count_callback'] );
		$has_both_repetition_properties = isset( $task['target_repetitions'] ) && isset( $task['repetition_count_callback'] );

		if ( $has_any_repetition_properties && ! $has_both_repetition_properties ) {
			_doing_it_wrong( 'validate_task', 'The Launchpad task being registered requires both a "target_repetitions" attribute and a "repetition_count_callback" callback', '6.3' );
			return false;
		}

		if ( isset( $task['target_repetitions'] ) && ! is_int( $task['target_repetitions'] ) ) {
			_doing_it_wrong( 'validate_task', 'The Launchpad task being registered requires a "target_repetitions" attribute that is an integer', '6.4' );
			return false;
		}

		return true;
	}

	/**
	 * Checks if Launchpad is enabled.
	 *
	 * @return boolean
	 */
	public function is_fullscreen_launchpad_enabled() {
		$launchpad_screen = get_option( 'launchpad_screen' );
		if ( 'full' !== $launchpad_screen ) {
			return false;
		}

		return $this->has_active_tasks();
	}
	/**
	 * Disables Launchpad by setting the `launchpad_screen` option to `off`.
	 *
	 * @return bool True if successful, false if not.
	 */
	private function disable_fullscreen_launchpad() {
		return update_option( 'launchpad_screen', 'off' );
	}

	/**
	 * Gets the title for a task list.
	 *
	 * @param string $id Task list id.
	 * @return string|null The title for the task list.
	 */
	public function get_task_list_title( $id ) {
		$task_list = $this->get_task_list( $id );

		return $this->load_value_from_callback( $task_list, 'get_title', null );
	}
}
