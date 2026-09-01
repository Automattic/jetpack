<?php
/**
 * AI Launchpad Subscribe-block completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Completes the AI-selected `add_subscribe_block` task from wp-admin when the Subscribe block is added to
 * front-end content or a block widget.
 *
 * The shared catalog's own listener only completes on template / template-part saves (the block-theme Site
 * Editor path). This covers the rest of the AI Launchpad's CTA surface without touching that shared code: any
 * published, front-end-viewable post type, plus the block-based widget editor (the classic-theme CTA target,
 * whose saves never fire save_post). Every path is gated on the task being AI-selected, so the legacy
 * launchpad is unaffected.
 */
class AI_Launchpad_Subscribe_Block_Listener {

	/**
	 * Hooks the post-save and block-widget-save watchers.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'save_post', array( __CLASS__, 'maybe_complete_from_post' ), 10, 2 );
		add_action( 'update_option_widget_block', array( __CLASS__, 'maybe_complete_from_widget' ), 10, 2 );
		add_action(
			'add_option_widget_block',
			static function ( $option, $value ) {
				self::maybe_complete_from_widget( null, $value );
			},
			10,
			2
		);
	}

	/**
	 * Completes the task when a published, front-end-viewable post carries the Subscribe block.
	 *
	 * Skips revisions, Headstart-seeded content, drafts, and non-viewable types — synced patterns (`wp_block`)
	 * hold the block without rendering a subscribe form, and templates are the shared catalog listener's job.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 * @return void
	 */
	public static function maybe_complete_from_post( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || ( defined( 'HEADSTART' ) && HEADSTART ) ) {
			return;
		}

		if ( ! ( $post instanceof \WP_Post ) || 'publish' !== $post->post_status || ! is_post_type_viewable( $post->post_type ) ) {
			return;
		}

		if ( ! self::is_task_selected() ) {
			return;
		}

		if ( has_block( 'jetpack/subscriptions', $post->post_content ) ) {
			wpcom_mark_launchpad_task_complete( 'add_subscribe_block' );
		}
	}

	/**
	 * Completes the task when any block widget carries the Subscribe block.
	 *
	 * @param mixed $old_value The previous `widget_block` option value (unused).
	 * @param mixed $value     The new `widget_block` option value.
	 * @return void
	 */
	public static function maybe_complete_from_widget( $old_value, $value ) {
		if ( ( defined( 'HEADSTART' ) && HEADSTART ) || ! self::is_task_selected() ) {
			return;
		}

		foreach ( (array) $value as $widget ) {
			if ( is_array( $widget ) && isset( $widget['content'] ) && has_block( 'jetpack/subscriptions', $widget['content'] ) ) {
				wpcom_mark_launchpad_task_complete( 'add_subscribe_block' );
				return;
			}
		}
	}

	/**
	 * Whether `add_subscribe_block` is among the AI-selected tasks.
	 *
	 * @return bool
	 */
	private static function is_task_selected() {
		return in_array( 'add_subscribe_block', wpcom_ai_launchpad_get_ai_task_ids(), true );
	}
}

AI_Launchpad_Subscribe_Block_Listener::register();
