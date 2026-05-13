<?php
/**
 * REST query augmentation for the Episodes dashboard.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Allows the Episodes dashboard to union category-assigned posts with drafts
 * produced by the Posts to Podcast pipeline (which are tagged via the
 * `_posts_to_podcast_metadata` meta key but may not yet be in the podcast
 * category).
 *
 * Activated per-request by the `include_p2p=1` query argument on `/wp/v2/posts`.
 */
class Episodes_Query {

	const REQUEST_PARAM = 'include_p2p';
	const META_KEY      = '_posts_to_podcast_metadata';

	/**
	 * Hook into `rest_post_query` so the dashboard can opt in to the union.
	 */
	public static function init() {
		add_filter( 'rest_post_query', array( __CLASS__, 'maybe_include_generated_drafts' ), 10, 2 );
	}

	/**
	 * When `include_p2p=1` is set, union the category-matching posts with any
	 * post carrying the `_posts_to_podcast_metadata` meta. The original
	 * category filter is replaced by an explicit `post__in` union so the
	 * caller sees both sets in a single page.
	 *
	 * @param array            $args    Query args destined for `WP_Query`.
	 * @param \WP_REST_Request $request The incoming REST request.
	 *
	 * @return array
	 */
	public static function maybe_include_generated_drafts( $args, $request ) {
		if ( ! $request instanceof \WP_REST_Request ) {
			return $args;
		}

		$include = $request->get_param( self::REQUEST_PARAM );
		if ( ! $include ) {
			return $args;
		}

		$generated_ids = get_posts(
			array(
				'fields'                 => 'ids',
				'post_type'              => $args['post_type'] ?? 'post',
				'post_status'            => $args['post_status'] ?? 'any',
				'meta_key'               => self::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'posts_per_page'         => -1,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'suppress_filters'       => true,
			)
		);

		if ( empty( $generated_ids ) ) {
			return $args;
		}

		// Resolve the category-matching IDs so we can union them. WP_Query
		// can't OR a tax query with a meta query in a single WP_Query pass,
		// so we precompute both sides and merge into `post__in`. The REST
		// posts controller surfaces the `categories` request param as
		// `category__in` in the query args.
		$category_ids = array();
		if ( ! empty( $args['category__in'] ) ) {
			$category_ids = get_posts(
				array(
					'fields'                 => 'ids',
					'post_type'              => $args['post_type'] ?? 'post',
					'post_status'            => $args['post_status'] ?? 'any',
					'category__in'           => $args['category__in'],
					'posts_per_page'         => -1,
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
					'suppress_filters'       => true,
				)
			);
			unset( $args['category__in'] );
		}

		$union = array_values( array_unique( array_merge( $category_ids, $generated_ids ) ) );
		if ( empty( $union ) ) {
			// Nothing matched on either side; force an empty page.
			$args['post__in'] = array( 0 );
			return $args;
		}

		$args['post__in'] = $union;
		return $args;
	}
}
