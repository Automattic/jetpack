<?php
/**
 * Get search stats for use in the wp-admin dashboard.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * Search stats (e.g. post count, post type breakdown)
 */
class Stats {
	const CACHE_EXPIRY             = 5 * MINUTE_IN_SECONDS;
	const CACHE_GROUP              = 'jetpack_search';
	const COUNT_ESTIMATE_CACHE_KEY = 'count_estimate';

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
	 * Estimate record counts via a local database query.
	 */
	public static function estimate_count() {
		$cached_value = wp_cache_get( self::COUNT_ESTIMATE_CACHE_KEY, self::CACHE_GROUP );
		if ( false !== $cached_value ) {
			return $cached_value;
		}

		global $wpdb;
		$indexable_statuses     = get_post_stati( array( 'public' => true ) );
		$unindexable_post_types = array_merge(
			// Explicitly exclude various post types registered by plugins.
			array(
				'elementor_library', // Used by Elementor.
				'jp_sitemap', // Used by Jetpack.
				'product_variation', // Used by Woocommerce.
				'redirect_rule', // Used by the Safe Redirect plugin.
				'reply', // Used by bbpress.
				'scheduled-action', // Used by Woocommerce.
			),
			get_post_types(
				array(
					'exclude_from_search' => true,
					'public'              => false,
				),
				'names',
				'or'
			)
		);

		$prep_for_query = function ( $string ) use ( $wpdb ) {
			// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.QuotedSimplePlaceholder -- This is used to sanitize post type names.
			return $wpdb->prepare( "'%s'", $string );
		};

		$statuses_list   = implode( ',', array_map( $prep_for_query, $indexable_statuses ) );
		$post_types_list = implode( ',', array_map( $prep_for_query, $unindexable_post_types ) );

		$count = (int) $wpdb->get_var(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- This is properly prepared, but the query is constructed using variables.
			"SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_status IN ($statuses_list) AND post_type NOT IN ($post_types_list)"
		);

		wp_cache_set( self::COUNT_ESTIMATE_CACHE_KEY, $count, self::CACHE_GROUP, self::CACHE_EXPIRY );
		return $count;
	}
}
