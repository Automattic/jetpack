<?php
/**
 * AI Launchpad first-post marker.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Owns the marker meta the AI Launchpad tags onto the first-post draft it creates (`first_post_published` /
 * `first_post_published_newsletter`).
 *
 * The draft is otherwise indistinguishable from any other draft post, so the marker lets the read path recognise the
 * AI-created draft precisely — used to show the "in progress" treatment and reopen that exact draft, rather than
 * treating any latest draft on the site as the task's in-progress post. Completion still runs through the catalog's
 * own `publish_post` listener; this class only registers the meta and looks the draft up.
 */
class AI_Launchpad_First_Post_Listener {

	/**
	 * Marker meta set by createFirstPostDraft on the AI-created first-post draft.
	 */
	const META_KEY = '_wpcom_ai_launchpad_first_post';

	/**
	 * Registers the marker meta.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
	}

	/**
	 * Registers the marker meta so the block editor preserves it and the create request can set it.
	 *
	 * The auth callback limits writes to users who can edit posts.
	 *
	 * @return void
	 */
	public static function register_meta() {
		register_post_meta(
			'post',
			self::META_KEY,
			array(
				'type'          => 'boolean',
				'single'        => true,
				'show_in_rest'  => true,
				'auth_callback' => static function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Returns the ID of the newest unpublished AI-created first post (a `draft` post carrying the marker meta), or null.
	 *
	 * @return int|null
	 */
	public static function get_draft_id() {
		$ids = get_posts(
			array(
				'post_type'        => 'post',
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

AI_Launchpad_First_Post_Listener::register();
