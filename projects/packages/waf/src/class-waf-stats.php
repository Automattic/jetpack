<?php
/**
 * Class used to retrieve WAF stats
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\IP\Utils as IP_Utils;
use Jetpack_Options;
use WP_Error;

/**
 * Retrieves WAF stats.
 */
class Waf_Stats {

	/**
	 * Name of the option where blocked requests are stored
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_waf_blocked_requests';

	/**
	 * Name of the option where the timestamp of the blocked requests is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = 'jetpack_waf_blocked_requests_timestamp';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 300; // 5 minutes.

	/**
	 * Updated the cached blocked requests and its timestamp
	 *
	 * @param array $blocked_requests The new blocked requests to be cached.
	 * @return void
	 */
	public static function update_option( $blocked_requests ) {
		update_option( self::OPTION_NAME, $blocked_requests );
		$end_date = time() + self::OPTION_EXPIRES_AFTER;
		update_option( self::OPTION_TIMESTAMP_NAME, $end_date );
	}

	/**
	 * Checks if the current cached blocked requests are expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_cache_expired() {
		$option_timestamp = get_option( static::OPTION_TIMESTAMP_NAME );

		if ( ! $option_timestamp ) {
			return true;
		}

		return time() > (int) $option_timestamp;
	}

	/**
	 * Retrieve blocked requests from the API
	 *
	 * @throws WP_Error If site is not registered.
	 * @throws WP_Error If API did not respond 200, or if response is empty.
	 * @return array
	 */
	public static function get_blocked_requests_from_api() {
		// TODO: Remove the following
		$default_data = array(
			'one_day_stats'    => 1500,
			'thirty_day_stats' => 300000,
		);

		$blog_id = Jetpack_Options::get_option( 'id' );

		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_connected' );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%s/waf-stats', $blog_id ),
			'2',
			array(),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			// return new WP_Error( 'failed_fetching_stats', 'Failed to fetch WAF stats from the server', array( 'status' => $response_code ) );
			// TODO: Reapply the above error and remove the following
			self::update_option( $default_data );
			return $default_data;
		}

		$blocked_requests_json = wp_remote_retrieve_body( $response );
		$blocked_requests      = json_decode( $blocked_requests_json, true );

		self::update_option( $blocked_requests['data'] );
		return $blocked_requests['data'];
	}

	/**
	 * Gets the current cached blocked requests
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_blocked_requests_from_options() {
		return maybe_unserialize( get_option( self::OPTION_NAME ) );
	}

	/**
	 * Gets the current WAF blocked requests
	 *
	 * @param bool $refresh_from_wpcom Refresh the local blocked requests cache from wpcom.
	 * @return array
	 */
	public static function get_blocked_requests( $refresh_from_wpcom = false ) {
		if ( $refresh_from_wpcom || self::is_cache_expired() ) {
			$blocked_requests = self::get_blocked_requests_from_api();
		} else {
			$blocked_requests = self::get_blocked_requests_from_options();
		}

		if ( is_wp_error( $blocked_requests ) ) {
			return false;
		}

		return $blocked_requests;
	}

	/**
	 * Get IP allow list count
	 *
	 * @return int The number of valid IP addresses in the allow list
	 */
	public static function get_ip_allow_list_count() {
		$ip_allow_list = get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME );

		if ( ! $ip_allow_list ) {
			return 0;
		}

		$results = IP_Utils::get_ip_addresses_from_string( $ip_allow_list );

		return count( $results );
	}

	/**
	 * Get IP block list count
	 *
	 * @return int The number of valid IP addresses in the block list
	 */
	public static function get_ip_block_list_count() {
		$ip_block_list = get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME );

		if ( ! $ip_block_list ) {
			return 0;
		}

		$results = IP_Utils::get_ip_addresses_from_string( $ip_block_list );

		return count( $results );
	}

	/**
	 * Get Rules version
	 *
	 * @return bool|string False if value is not found. The current stored rules version if cache is found.
	 *
	 * @deprecated 0.12.3 Use Automattic\Jetpack\Waf\Waf_Stats::get_automatic_rules_last_updated() to version the rules instead.
	 */
	public static function get_rules_version() {
		_deprecated_function( __METHOD__, 'waf-0.12.3', 'Automattic\Jetpack\Waf\Waf_Stats::get_automatic_rules_last_updated' );

		return get_option( Waf_Rules_Manager::VERSION_OPTION_NAME );
	}

	/**
	 * Get Automatic Rules last updated timestamp
	 *
	 * @return bool|string False if value is not found. The timestamp the current stored rules was last updated if cache is found.
	 */
	public static function get_automatic_rules_last_updated() {
		return get_option( Waf_Rules_Manager::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME );
	}
}
