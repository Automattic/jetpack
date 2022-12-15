<?php
/**
 * Class used to retrieve WAF stats
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * Retrieves WAF stats.
 */
class Waf_Stats {

	/**
	 * Retrieve stats from the API
	 *
	 * @throws \Exception If site is not registered.
	 * @throws \Exception If API did not respond 200.
	 * @throws \Exception If data is missing from response.
	 * @return array
	 */
	public static function get_stats_from_api() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			throw new \Exception( 'Site is not registered' );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%s/waf-stats', $blog_id ),
			'2',
			array(),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $response_code ) {
			throw new \Exception( 'API connection failed.', $response_code );
		}

		$stats_json = wp_remote_retrieve_body( $response );
		$stats      = json_decode( $stats_json, true );

		if ( empty( $stats['data'] ) ) {
			throw new \Exception( 'Data missing from response.' );
		}

		return $stats['data'];
	}
}
