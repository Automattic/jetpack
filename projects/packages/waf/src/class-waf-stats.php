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

	/**
	 * Get IP allow list count
	 *
	 * @return integer The number of valid IP addresses in the block list
	 */
	public static function get_ip_allow_list_count() {
		$ip_allow_list = get_option( Waf_Runner::IP_ALLOW_LIST_OPTION_NAME );

		$results = Waf_Runner::ip_option_to_array( $ip_allow_list );

		return count( $results );
	}

	/**
	 * Get IP block list count
	 *
	 * @return integer The number of valid IP addresses in the allow list
	 */
	public static function get_ip_block_list_count() {
		$ip_block_list = get_option( Waf_Runner::IP_BLOCK_LIST_OPTION_NAME );

		$results = Waf_Runner::ip_option_to_array( $ip_block_list );

		return count( $results );
	}

	/**
	 * Get Rules version
	 *
	 * @return string The current stored rules version
	 */
	public static function get_rules_version() {
		return get_option( Waf_Runner::VERSION_OPTION_NAME );
	}

	/**
	 * Get Rules last updated date
	 *
	 * @return string The date the current stored rules was last updated
	 */
	public static function get_automatic_rules_last_updated() {
		$rules_last_updated = get_option( Waf_Runner::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME );
		return gmdate( 'F j, Y', $rules_last_updated );
	}

	/**
	 * Get WAF stats
	 *
	 * @return array The available WAF stats
	 */
	public static function get_waf_stats() {
		return array(
			'blocked_requests'             => array(
				'one_day_stats'    => 15,
				'thirty_day_stats' => 500,
			),
			'ip_allow_list_count'          => self::get_ip_allow_list_count(),
			'ip_block_list_count'          => self::get_ip_block_list_count(),
			'rules_version'                => self::get_rules_version(),
			'automatic_rules_last_updated' => self::get_rules_last_updated(),
		);
	}
}
