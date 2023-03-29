<?php
/**
 * Provides data stats about videos inside VideoPress
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * Provides data stats about videos inside VideoPress
 */
class Stats {

	/**
	 * Returns the counter of today's plays for all videos.
	 *
	 * @return int|WP_Error the total of plays for today, or WP_Error on failure.
	 */
	public static function get_today_plays() {
		$error = new WP_Error(
			'videopress_stats_error',
			__( "Could not fetch today's stats from the service", 'jetpack-videopress-pkg' )
		);

		$blog_id = VideoPressToken::blog_id();

		$path = sprintf(
			'sites/%d/stats/video-plays',
			$blog_id
		);

		$response = Client::wpcom_json_api_request_as_blog( $path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $error;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return $error;
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! $data || ! isset( $data['days'] ) || count( $data['days'] ) === 0 ) {
			return $error;
		}

		/*
		 * The only result here is today's stats
		 */
		$today_stats = array_pop( $data['days'] );

		return $today_stats['total_plays'];
	}

	/**
	 * Returns the showcase stats for VideoPress.
	 *
	 * @return array|WP_Error a list of stats, or WP_Error on failure.
	 */
	public static function get_showcase_stats() {
		$error_code    = 'videopress_showcase_stats_error';
		$error_message = __( 'Could not fetch showcase stats from the service', 'jetpack-videopress-pkg' );

		$blog_id = VideoPressToken::blog_id();

		$path = sprintf(
			'sites/%d/stats/video-plays?period=day&num=14&complete_stats=true',
			$blog_id
		);

		$response = Client::wpcom_json_api_request_as_blog( $path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				$error_code,
				$error_message,
				array( 'status' => $response_code )
			);
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! $data ) {
			return new WP_Error(
				$error_code,
				$error_message
			);
		}

		// Get only the list of dates
		$dates = $data['days'];

		// Organize the data into the planned stats
		return self::prepare_showcase_stats( $dates );
	}

	/**
	 * Prepares the showcase stats for VideoPress.
	 *
	 * @param array $dates The list of dates returned by the API.
	 * @return array a list of stats.
	 */
	public static function prepare_showcase_stats( $dates ) {
		/**
		 * Ensure the sorting of the dates, recent ones first.
		 * This way, the first 7 positions are from the last 7 days,
		 * and the next 7 positions are from the 7 days before it.
		 */
		krsort( $dates );

		// template for the response
		$showcase_stats = array(
			'label' => __( 'last 7 days', 'jetpack-videopress-pkg' ),
			'data'  => array(
				'views'       => array(
					'current'  => 0,
					'previous' => 0,
				),
				'impressions' => array(
					'current'  => 0,
					'previous' => 0,
				),
				'watch_time'  => array(
					'current'  => 0,
					'previous' => 0,
				),
			),
		);

		// Go through the dates to compute the stats
		$counter = 0;
		foreach ( $dates as $date_info ) {
			$date_totals = $date_info['total'];

			if ( $counter < 7 ) {

				// the first 7 elements are for the current period
				$showcase_stats['data']['views']['current']       += $date_totals['views'];
				$showcase_stats['data']['impressions']['current'] += $date_totals['impressions'];
				$showcase_stats['data']['watch_time']['current']  += $date_totals['watch_time'];

			} else {

				// the next 7 elements are for the previous period
				$showcase_stats['data']['views']['previous']       += $date_totals['views'];
				$showcase_stats['data']['impressions']['previous'] += $date_totals['impressions'];
				$showcase_stats['data']['watch_time']['previous']  += $date_totals['watch_time'];

			}

			++$counter;
		}

		return $showcase_stats;
	}
}
