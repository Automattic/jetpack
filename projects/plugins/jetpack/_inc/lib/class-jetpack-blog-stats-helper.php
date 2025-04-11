<?php
/**
 * Blog Stats block helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Stats\WPCOM_Stats;

/**
 * Class Jetpack_Blog_Stats_Helper
 */
class Jetpack_Blog_Stats_Helper {
	/**
	 * Returns user's blog stats.
	 *
	 * @param array $stats_option Array containing the Blog Stats block attributes.
	 *
	 * @return int
	 */
	public static function get_stats( $stats_option ) {
		$stats_option = wp_parse_args(
			$stats_option,
			array(
				'statsOption' => 'blog',
				'statsData'   => 'views',
				'postId'      => get_the_ID(),
			)
		);

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			// Jetpack sites.
			$wpcom_stats = new WPCOM_Stats();

			if ( $stats_option['statsOption'] === 'post' ) {
				// Cache in post meta to prevent wp_options blowing up when retrieving views
				// for multiple posts simultaneously (eg. when inserted into template).
				$cache_in_meta = true;
				$data          = $wpcom_stats->convert_stats_array_to_object(
					$wpcom_stats->get_post_views(
						$stats_option['postId'],
						array( 'fields' => 'views' ), // No visitor count for posts.
						$cache_in_meta
					)
				);

				if ( isset( $data->views ) ) {
					return $data->views;
				}
			} else {
				$data = $wpcom_stats->convert_stats_array_to_object(
					$wpcom_stats->get_stats( array( 'fields' => 'stats' ) )
				);

				if ( $stats_option['statsData'] === 'views' && isset( $data->stats->views ) ) {
					return $data->stats->views;
				}

				if ( $stats_option['statsData'] === 'visitors' && isset( $data->stats->visitors ) ) {
					return $data->stats->visitors;
				}
			}
		} elseif ( $stats_option['statsOption'] === 'post' ) {
			// Simple sites.
			if ( function_exists( 'get_all_time_postviews' ) ) {
				// This is cached so no need to cache it again.
				// @phan-suppress-next-line PhanUndeclaredFunction
				return (int) get_all_time_postviews( $stats_option['postId'] );
			}
		} else {
			// Simple sites.
			$_blog_id = get_current_blog_id();
			if ( $stats_option['statsData'] === 'views' && function_exists( 'stats_grandtotal_views' ) ) {
				// This is cached so no need to cache it again.
				// @phan-suppress-next-line PhanUndeclaredFunction
				return stats_grandtotal_views( $_blog_id );
			}

			if ( $stats_option['statsData'] === 'visitors' && function_exists( 'stats_get_visitors' ) ) {
				$stats = wp_cache_get( "stats_get_visitors_total_$_blog_id", 'blog-stats-block' );
				if ( false !== $stats ) {
					return $stats;
				}
				// @phan-suppress-next-line PhanUndeclaredFunction
				$stats = array_sum( stats_get_visitors( get_current_blog_id(), false, gmdate( 'Y' ) - 2012, 365 ) );
				wp_cache_set( "stats_get_visitors_total_$_blog_id", $stats, 'blog-stats-block', HOUR_IN_SECONDS );

				return $stats;
			}
		}

		return 0;
	}
}
