<?php
/**
 * Get search stats for use in the wp-admin dashboard.
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * Search stats (e.g. post count, post type breakdown)
 */
class Search_Stats {
	const EXCLUDED_POST_TYPES = array(
		'elementor_library', // Used by Elementor.
		'jp_sitemap', // Used by Jetpack.
		'revision',
		'vip-legacy-redirect',
		'scheduled-action',
		'nbcs_video_lookup',
		'reply', // bbpress, these get included in the topic
		'product_variation', // woocommerce, not really public
		'nav_menu_item',
		'shop_order', // woocommerce, not really public
		'redirect_rule', // Used by the Safe Redirect plugin.
	);

	const DO_NOT_EXCLUDE_POST_TYPES = array(
		'topic', // bbpress
		'forum', // bbpress
	);

	const CACHE_EXPIRY                  = 1 * MINUTE_IN_SECONDS;
	const CACHE_GROUP                   = 'jetpack_search';
	const POST_TYPE_BREAKDOWN_CACHE_KEY = 'post_type_break_down';
	const TOTAL_POSTS_COUNT_CACHE_KEY   = 'total-post-count';
	const POST_COUNT_QUERY_LIMIT        = 1e5;

	/**
	 * Get stats from the WordPress.com API for the current blog ID.
	 */
	public function get_stats_from_wpcom() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		if ( ! is_numeric( $blog_id ) ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . (int) $blog_id . '/jetpack-search/stats',
			'2',
			array(),
			null,
			'wpcom'
		);

		return $response;
	}

	/**
	 * Queue querying the post type breakdown from WordPress.com API for the current blog ID.
	 */
	public function queue_post_count_query_from_wpcom() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		if ( ! is_numeric( $blog_id ) ) {
			return null;
		}

		Client::wpcom_json_api_request_as_blog(
			'/sites/' . (int) $blog_id . '/jetpack-search/queue-post-count',
			'2',
			array(),
			null,
			'wpcom'
		);
	}

	/**
	 * Estimate record counts via a local database query.
	 */
	public static function estimate_count() {
		return array_sum( static::get_post_type_breakdown() );
	}

	/**
	 * Calculate breakdown of post types for the site.
	 */
	public static function get_post_type_breakdown() {
		$indexable_post_types   = get_post_types(
			array(
				'public'              => true,
				'exclude_from_search' => false,
			)
		);
		$indexable_status_array = get_post_stati(
			array(
				'public'              => true,
				'exclude_from_search' => false,
			)
		);
		$raw_posts_counts       = static::get_raw_post_type_breakdown();
		if ( ! $raw_posts_counts || is_wp_error( $raw_posts_counts ) ) {
			return array();
		}
		$posts_counts = static::get_post_type_breakdown_with( $raw_posts_counts, $indexable_post_types, $indexable_status_array );

		return $posts_counts;
	}

	/**
	 * Calculate breakdown of post types with passed in indexable post types and statuses.
	 * The function is going to be used from WPCOM as well for consistency.
	 *
	 * @param array $raw_posts_counts Array of post types with counts as value.
	 * @param array $indexable_post_types Array of indexable post types.
	 * @param array $indexable_status_array Array of indexable post statuses.
	 */
	public static function get_post_type_breakdown_with( $raw_posts_counts, $indexable_post_types, $indexable_status_array ) {
		$posts_counts = array();
		foreach ( $raw_posts_counts as $row ) {
			// ignore if status is not public.
			if ( ! in_array( $row['post_status'], $indexable_status_array, true ) ) {
				continue;
			}
			// ignore if post type is in excluded post types.
			if ( in_array( $row['post_type'], self::EXCLUDED_POST_TYPES, true ) ) {
				continue;
			}
			// ignore if post type is not public and is not explicitly included.
			if ( ! in_array( $row['post_type'], $indexable_post_types, true ) &&
				! in_array( $row['post_type'], self::DO_NOT_EXCLUDE_POST_TYPES, true )
			) {
				continue;
			}
			// add up post type counts of potentially multiple post_status.
			if ( ! isset( $posts_counts[ $row['post_type'] ] ) ) {
				$posts_counts[ $row['post_type'] ] = 0;
			}
			$posts_counts[ $row['post_type'] ] += intval( $row['num_posts'] );
		}

		arsort( $posts_counts, SORT_NUMERIC );
		return $posts_counts;
	}

	/**
	 * Get raw post type breakdown from the database or a remote request if posts count is high.
	 */
	protected static function get_raw_post_type_breakdown() {
		global $wpdb;

		$results = wp_cache_get( self::POST_TYPE_BREAKDOWN_CACHE_KEY, self::CACHE_GROUP );
		if ( false !== $results ) {
			return $results;
		}

		$total_posts_count = wp_cache_get( self::TOTAL_POSTS_COUNT_CACHE_KEY, self::CACHE_GROUP );
		if ( false === $total_posts_count ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery */
			$total_posts_counts = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts}" );
			wp_cache_set( self::TOTAL_POSTS_COUNT_CACHE_KEY, $total_posts_counts, self::CACHE_GROUP, self::CACHE_EXPIRY );
		}

		// Get post type breakdown from a remote request if the post count is high
		if ( $total_posts_count > self::POST_COUNT_QUERY_LIMIT ) {
			$search_stats = new Search_Stats();
			$search_stats->queue_post_count_query_from_wpcom();
			$wpcom_stats = json_decode( wp_remote_retrieve_body( $search_stats->get_stats_from_wpcom() ), true );
			if ( ! empty( $wpcom_stats['raw_post_type_breakdown'] ) ) {
				$results = $wpcom_stats['raw_post_type_breakdown'];
				wp_cache_set( self::POST_TYPE_BREAKDOWN_CACHE_KEY, $results, self::CACHE_GROUP, self::CACHE_EXPIRY );
				return $results;
			} else {
				return array();
			}
		}

		$query = "SELECT post_type, post_status, COUNT( * ) AS num_posts
		FROM {$wpdb->posts}
		WHERE post_password = ''
		GROUP BY post_type, post_status";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery
		$results = $wpdb->get_results( $query, ARRAY_A );
		wp_cache_set( self::POST_TYPE_BREAKDOWN_CACHE_KEY, $results, self::CACHE_GROUP, self::CACHE_EXPIRY );
		return $results;
	}
}
