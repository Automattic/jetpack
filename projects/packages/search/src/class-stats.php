<?php
/**
 * Get search stats for use in the wp-admin dashboard.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Jetpack_Options;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Search stats (e.g. post count, post type breakdown)
 */
class Stats {
	/**
	 * Get stats from the WordPress.com API for the current blog ID.
	 */
	public function get_stats_from_wpcom() {
		if ( ( new Status() )->is_offline_mode() ) {
			return self::get_offline_mock_stats_response();
		}

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
	 * Sample post-count/index data shown in local development mode, so the
	 * real Search dashboard's record meter renders with representative
	 * numbers instead of erroring out with no connection. Shaped like a
	 * `wp_remote_get()` response so it round-trips through the REST
	 * controller's `make_proper_response()` the same way a real WPCOM
	 * response would.
	 *
	 * @return array
	 */
	private static function get_offline_mock_stats_response() {
		return array(
			'body'     => wp_json_encode(
				array(
					'post_count'          => 116,
					'post_type_breakdown' => array(
						array(
							'slug'  => 'post',
							'count' => 84,
						),
						array(
							'slug'  => 'page',
							'count' => 32,
						),
					),
					'last_indexed_date'   => gmdate( 'c' ),
				),
				JSON_UNESCAPED_SLASHES
			),
			'response' => array( 'code' => 200 ),
		);
	}
}
