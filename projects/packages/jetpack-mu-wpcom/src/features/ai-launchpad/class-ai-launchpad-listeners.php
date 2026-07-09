<?php
/**
 * AI Launchpad task completion listeners.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the existing Launchpad completion listeners for the AI-selected tasks, without the fullscreen gate.
 *
 * Task selection is read from `wpcom_ai_launchpad_ai_output`; completion writes go through each task's own
 * `add_listener_callback` into `launchpad_checklist_tasks_statuses`.
 */
class AI_Launchpad_Listeners {

	/**
	 * Hooks listener registration after the Launchpad task catalog is registered on `init` (priority 11).
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'init', array( __CLASS__, 'add_listener_hooks_to_correct_action' ), 12 );
		add_filter( 'wpcom_launchpad_is_task_active_for_completion', array( __CLASS__, 'treat_ai_task_as_active' ), 10, 2 );
	}

	/**
	 * Treats AI-selected tasks as active so their completion callbacks write status even when absent from `site_intent`.
	 *
	 * @param bool   $is_active Whether the task is active per the site_intent task list.
	 * @param string $task_id   The task being completed.
	 * @return bool
	 */
	public static function treat_ai_task_as_active( $is_active, $task_id ) {
		if ( $is_active ) {
			return true;
		}

		return in_array( $task_id, wpcom_ai_launchpad_get_ai_task_ids(), true );
	}

	/**
	 * Adds the listeners now, or on `rest_api_switched_to_blog` for REST API
	 * requests, mirroring wpcom_add_active_task_listener_hooks_to_correct_action().
	 *
	 * @return void
	 */
	public static function add_listener_hooks_to_correct_action() {
		$url = wp_parse_url( home_url(), PHP_URL_HOST );
		if ( $url === 'public-api.wordpress.com' ) {
			add_action( 'rest_api_switched_to_blog', array( __CLASS__, 'add_active_task_listeners' ) );
			return;
		}

		self::add_active_task_listeners();
	}

	/**
	 * Adds each AI-selected task's `add_listener_callback` hooks for incomplete tasks.
	 *
	 * @return void
	 */
	public static function add_active_task_listeners() {
		$task_ids = wpcom_ai_launchpad_get_ai_task_ids();
		if ( empty( $task_ids ) ) {
			return;
		}

		$task_lists = wpcom_launchpad_checklists();

		foreach ( $task_ids as $task_id ) {
			$task_definition = $task_lists->get_task( $task_id );
			if ( ! isset( $task_definition['add_listener_callback'] ) || ! is_callable( $task_definition['add_listener_callback'] ) ) {
				continue;
			}

			if ( $task_lists->is_task_id_complete( $task_id ) ) {
				continue;
			}

			call_user_func( $task_definition['add_listener_callback'], $task_definition );
		}
	}
}

AI_Launchpad_Listeners::register();
