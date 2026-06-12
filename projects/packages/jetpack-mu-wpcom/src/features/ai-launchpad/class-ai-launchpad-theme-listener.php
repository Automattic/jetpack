<?php
/**
 * AI Launchpad theme-selection completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Marks the `site_theme_selected` task complete on `switch_theme` when the AI
 * Launchpad selected it.
 *
 * The catalog's `site_theme_selected` task has no `add_listener_callback`, so
 * AI_Launchpad_Listeners does not register completion for it - it completes only
 * via `is_complete_callback` polling. This listener fills that gap by writing the
 * completion directly when the user activates a new theme.
 */
class AI_Launchpad_Theme_Listener {

	/**
	 * Hooks the theme-switch listener.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'switch_theme', array( __CLASS__, 'mark_theme_selected_complete' ) );
	}

	/**
	 * Marks `site_theme_selected` complete when it is among the AI-selected tasks.
	 *
	 * Writes the completion directly (ungated) rather than through the
	 * `*_if_active` path: the AI-selected task may not be in the site's legacy
	 * site_intent task list, which the `*_if_active` path would silently no-op on.
	 *
	 * @return void
	 */
	public static function mark_theme_selected_complete() {
		if ( ! in_array( 'site_theme_selected', self::get_ai_task_ids(), true ) ) {
			return;
		}

		wpcom_mark_launchpad_task_complete( 'site_theme_selected' );
	}

	/**
	 * Reads the AI-selected task IDs from the `wpcom_ai_launchpad_ai_output` option.
	 *
	 * @return string[] Task IDs, empty when the option is unset or malformed.
	 */
	private static function get_ai_task_ids() {
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );
		if ( ! is_array( $ai_output ) || ! isset( $ai_output['payload']['tasks'] ) || ! is_array( $ai_output['payload']['tasks'] ) ) {
			return array();
		}

		$task_ids = array();
		foreach ( $ai_output['payload']['tasks'] as $task ) {
			if ( is_array( $task ) && isset( $task['id'] ) && is_string( $task['id'] ) ) {
				$task_ids[] = $task['id'];
			}
		}

		return $task_ids;
	}
}

AI_Launchpad_Theme_Listener::register();
