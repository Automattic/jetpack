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
}
