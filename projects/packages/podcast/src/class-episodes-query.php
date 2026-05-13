<?php
/**
 * REST query augmentation for the Episodes dashboard.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Restricts the Episodes dashboard listing to drafts produced by the Posts to
 * Podcast pipeline. The pipeline tags every generated draft with the
 * `_posts_to_podcast_metadata` meta key (see wp-content/lib/posts-to-podcast/
 * pipeline.php's `posts_to_podcast_persist_draft`), and the SPA opts into the
 * filter by sending `p2p_only=1` on `/wp/v2/posts`.
 */
class Episodes_Query {

	const REQUEST_PARAM = 'p2p_only';
	const META_KEY      = '_posts_to_podcast_metadata';

	/**
	 * Hook into `rest_post_query` so the dashboard can scope the listing.
	 */
	public static function init() {
		add_filter( 'rest_post_query', array( __CLASS__, 'maybe_restrict_to_generated_drafts' ), 10, 2 );
	}

	/**
	 * When `p2p_only=1` is set, replace any category/taxonomy filter with a
	 * single-meta-key existence check so the listing only includes generated
	 * drafts. We translate the filter into `post__in` because the REST posts
	 * controller doesn't expose a `meta_query` arg, and `meta_key` alone
	 * coexists awkwardly with the controller's existing query shape.
	 *
	 * @param array            $args    Query args destined for `WP_Query`.
	 * @param \WP_REST_Request $request The incoming REST request.
	 *
	 * @return array
	 */
	public static function maybe_restrict_to_generated_drafts( $args, $request ) {
		if ( ! $request instanceof \WP_REST_Request ) {
			return $args;
		}

		if ( ! $request->get_param( self::REQUEST_PARAM ) ) {
			return $args;
		}

		$generated_ids = get_posts(
			array(
				'fields'                 => 'ids',
				'post_type'              => isset( $args['post_type'] ) ? $args['post_type'] : 'post',
				'post_status'            => isset( $args['post_status'] ) ? $args['post_status'] : 'any',
				'meta_key'               => self::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'posts_per_page'         => -1,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'suppress_filters'       => true,
			)
		);

		// Drop any category constraint the SPA passed alongside `p2p_only=1`
		// so we don't AND it with the meta filter and accidentally exclude
		// drafts that aren't in the podcast category.
		unset( $args['category__in'], $args['cat'] );

		$args['post__in'] = empty( $generated_ids ) ? array( 0 ) : array_map( 'intval', $generated_ids );
		return $args;
	}
}
