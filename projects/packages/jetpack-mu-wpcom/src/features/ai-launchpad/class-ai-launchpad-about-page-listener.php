<?php
/**
 * AI Launchpad About-page completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Completes the AI-selected About-page tasks from wp-admin: `add_about_page` (first published) and
 * `update_about_page` (edited again afterwards).
 *
 * The catalog's own completion depends on the `_wpcom_template_layout_category` meta, which is not registered on
 * Atomic, so this tags the AI-created About page with its own marker meta and watches that page's transitions instead.
 */
class AI_Launchpad_About_Page_Listener {

	/**
	 * Marker meta set by createPatternPage on the AI-created About page.
	 */
	const META_KEY = '_wpcom_ai_launchpad_about_page';

	/**
	 * Registers the marker meta and the publish/update watcher.
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
	 * The auth callback limits writes to users who can edit pages.
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
	 * Completes the About-page tasks on the marked page's status transitions: first publish -> add_about_page,
	 * a later edit of the published page -> update_about_page.
	 *
	 * @param string   $new_status The new post status.
	 * @param string   $old_status The previous post status.
	 * @param \WP_Post $post       The post being transitioned.
	 * @return void
	 */
	public static function maybe_complete( $new_status, $old_status, $post ) {
		if ( 'publish' !== $new_status || ! ( $post instanceof \WP_Post ) || 'page' !== $post->post_type ) {
			return;
		}

		$ai_task_ids = wpcom_ai_launchpad_get_ai_task_ids();
		if ( empty( $ai_task_ids ) ) {
			return;
		}

		if ( ! get_post_meta( $post->ID, self::META_KEY, true ) ) {
			return;
		}

		if ( 'publish' !== $old_status ) {
			if ( in_array( 'add_about_page', $ai_task_ids, true ) ) {
				wpcom_mark_launchpad_task_complete( 'add_about_page' );
			}
		} elseif ( in_array( 'update_about_page', $ai_task_ids, true ) ) {
			wpcom_mark_launchpad_task_complete( 'update_about_page' );
		}
	}

	/**
	 * Returns the ID of the newest unpublished AI-created About page (a `draft` page carrying the marker meta), or null.
	 *
	 * Backs the "in progress" treatment: an About page saved but not yet published, so the task can reopen that draft
	 * instead of creating a duplicate.
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

AI_Launchpad_About_Page_Listener::register();
