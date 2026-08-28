<?php
/**
 * AI Launchpad theme-selection completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Marks the `site_theme_selected` task complete on `switch_theme` when the AI Launchpad selected it.
 *
 * The catalog's task has no `add_listener_callback`, so this listener writes completion directly on theme activation.
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
	 * Writes directly rather than through the `*_if_active` path, which would no-op when the task is absent from
	 * the site's legacy site_intent list.
	 *
	 * @return void
	 */
	public static function mark_theme_selected_complete() {
		if ( ! in_array( 'site_theme_selected', wpcom_ai_launchpad_get_ai_task_ids(), true ) ) {
			return;
		}

		wpcom_mark_launchpad_task_complete( 'site_theme_selected' );
	}
}

AI_Launchpad_Theme_Listener::register();
