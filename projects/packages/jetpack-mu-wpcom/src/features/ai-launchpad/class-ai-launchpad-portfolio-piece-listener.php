<?php
/**
 * AI Launchpad portfolio-piece completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The registry owns this task's definition, and its completion write.
 */
require_once __DIR__ . '/class-ai-launchpad-task-registry.php';

/**
 * Completes the `add_portfolio_piece` task from wp-admin when the AI-created project page is published.
 *
 * The task is defined by AI_Launchpad_Task_Registry rather than the shared catalog, which has no completion
 * callback for it, so completion is gated on the page's marker meta plus eligibility.
 *
 * A page, and therefore this shape, rather than the first-post listener's. Its closest cousin by subject is
 * AI_Launchpad_First_Post_Listener — both are "publish the first piece of something" — but that class only
 * registers meta and finds the draft, because the shared catalog owns `first_post_published` and completes it
 * through its own `publish_post` hook. Nothing in the catalog knows this task exists, so completion has to be
 * written here, and it has to go through AI_Launchpad_Task_Registry::mark_complete(): the About page's route,
 * wpcom_mark_launchpad_task_complete(), resolves ids against wpcom_launchpad_get_task_definitions() and
 * `continue`s past anything absent from it, which is every registry id by construction.
 *
 * The marker is also what puts the task "in progress": a project page saved but not yet published reopens
 * through get_draft_id() instead of the card creating a second one. Each page task queries its own marker for
 * that, so a gallery, contact, events or video draft never puts the portfolio card in progress.
 */
class AI_Launchpad_Portfolio_Piece_Listener {

	/**
	 * Marker meta set by createPortfolioPiece on the AI-created project page.
	 */
	const META_KEY = '_wpcom_ai_launchpad_portfolio_piece';

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
	 * Completes add_portfolio_piece when a page carrying the marker is first published.
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

		AI_Launchpad_Task_Registry::mark_complete( 'add_portfolio_piece' );
	}

	/**
	 * Returns the ID of the newest unpublished AI-created project page (a `draft` page carrying the marker), or null.
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

AI_Launchpad_Portfolio_Piece_Listener::register();
