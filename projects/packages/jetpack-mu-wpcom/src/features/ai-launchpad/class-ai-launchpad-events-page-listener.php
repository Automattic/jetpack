<?php
/**
 * AI Launchpad events-page completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The registry owns this task's definition, and its completion write.
 */
require_once __DIR__ . '/class-ai-launchpad-task-registry.php';

/**
 * Completes the `add_events_page` task from wp-admin when the AI-created events page is published.
 *
 * The task is defined by AI_Launchpad_Task_Registry rather than the shared catalog, which has no completion
 * callback for it, so completion is gated on the page's marker meta plus eligibility.
 *
 * The marker is also what puts the task "in progress": an events page saved but not yet published reopens
 * through get_draft_id() instead of the card creating a second one. Each page task queries its own marker for
 * that, so a gallery or contact draft never puts the events card in progress.
 */
class AI_Launchpad_Events_Page_Listener {

	/**
	 * Marker meta set by createEventsPage on the AI-created events page.
	 */
	const META_KEY = '_wpcom_ai_launchpad_events_page';

	/**
	 * Registers the marker meta and the publish watcher.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
		add_action( 'transition_post_status', array( __CLASS__, 'maybe_complete' ), 10, 3 );
	}

	/**
	 * Registers the marker meta so the block editor preserves it and the create request can set it.
	 *
	 * @return void
	 */
	public static function register_meta() {
		register_post_meta(
			'page',
			self::META_KEY,
			array(
				'type'          => 'boolean',
				'single'        => true,
				'show_in_rest'  => true,
				'auth_callback' => static function () {
					return current_user_can( 'edit_pages' );
				},
			)
		);
	}

	/**
	 * Completes add_events_page when a page carrying the marker is first published.
	 *
	 * @param string   $new_status The new post status.
	 * @param string   $old_status The previous post status.
	 * @param \WP_Post $post       The post being transitioned.
	 * @return void
	 */
	public static function maybe_complete( $new_status, $old_status, $post ) {
		if ( 'publish' !== $new_status || 'publish' === $old_status ) {
			return;
		}
		if ( ! ( $post instanceof \WP_Post ) || 'page' !== $post->post_type ) {
			return;
		}
		if ( ! get_post_meta( $post->ID, self::META_KEY, true ) ) {
			return;
		}
		// Fail closed: if the gate is unavailable, treat the site as not eligible.
		if ( ! function_exists( 'wpcom_ai_launchpad_is_eligible' ) || ! wpcom_ai_launchpad_is_eligible() ) {
			return;
		}

		AI_Launchpad_Task_Registry::mark_complete( 'add_events_page' );
	}

	/**
	 * Returns the ID of the newest unpublished AI-created events page (a `draft` page carrying the marker), or null.
	 *
	 * @return int|null
	 */
	public static function get_draft_id() {
		$ids = get_posts(
			array(
				'post_type'        => 'page',
				'post_status'      => 'draft',
				'posts_per_page'   => 1,
				'orderby'          => 'date',
				'order'            => 'DESC',
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => false,
				'meta_key'         => self::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one-off read behind the AI Launchpad eligibility gate.
			)
		);

		return empty( $ids ) ? null : (int) $ids[0];
	}
}

AI_Launchpad_Events_Page_Listener::register();
