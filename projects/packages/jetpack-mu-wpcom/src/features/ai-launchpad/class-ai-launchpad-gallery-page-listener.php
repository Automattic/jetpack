<?php
/**
 * AI Launchpad gallery-page completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Completes the synthetic `add_gallery_page` task from wp-admin when the AI-created gallery page is published.
 *
 * The task is injected by AI_Launchpad_REST (never persisted into the AI output), so completion is gated on the
 * page's marker meta plus eligibility rather than on the AI task-id list.
 */
class AI_Launchpad_Gallery_Page_Listener {

	/**
	 * Marker meta set by createPatternPage on the AI-created gallery page.
	 */
	const META_KEY = '_wpcom_ai_launchpad_gallery_page';

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
	 * Completes add_gallery_page when a page carrying the marker is first published.
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

		// The synthetic id is not in the shared catalog, so wpcom_mark_launchpad_task_complete() would drop it
		// (wpcom_launchpad_update_task_status() skips unknown ids); write the status option directly instead.
		$statuses                     = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$statuses['add_gallery_page'] = true;
		update_option( 'launchpad_checklist_tasks_statuses', $statuses );
	}

	/**
	 * Returns the ID of the newest unpublished AI-created gallery page (a `draft` page carrying the marker), or null.
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

AI_Launchpad_Gallery_Page_Listener::register();
