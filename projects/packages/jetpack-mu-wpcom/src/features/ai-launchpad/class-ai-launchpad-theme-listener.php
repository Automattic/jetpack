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
		if ( ! in_array( 'site_theme_selected', wpcom_ai_launchpad_get_ai_task_ids(), true ) ) {
			return;
		}

		wpcom_mark_launchpad_task_complete( 'site_theme_selected' );
	}
}

AI_Launchpad_Theme_Listener::register();
