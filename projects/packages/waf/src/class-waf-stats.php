<?php
/**
 * Class used to retrieve WAF stats
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\IP\Utils as IP_Utils;

/**
 * Retrieves WAF stats.
 */
class Waf_Stats {

	/**
	 * Retrieve blocked requests from database
	 *
	 * @return array
	 */
	public static function get_blocked_requests() {
		return array(
			'current_day' => Waf_Blocklog_Manager::get_current_day_block_count(),
			'thirty_days' => Waf_Blocklog_Manager::get_thirty_days_block_counts(),
			'all_time'    => Waf_Blocklog_Manager::get_all_time_block_count(),
		);
	}

	/**
	 * Get IP allow list count
	 *
	 * @return int The number of valid IP addresses in the allow list
	 *
	 * @deprecated 0.20.1 Use Automattic\Jetpack\Waf\Waf_Blocklog_Manager API instead.
	 */
	public static function get_ip_allow_list_count() {
		_deprecated_function( __METHOD__, 'waf-0.20.1', 'Automattic\Jetpack\Waf\Waf_Blocklog_Manager' );

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
	 *
	 * @deprecated 0.20.1 Use Automattic\Jetpack\Waf\Waf_Blocklog_Manager API instead.
	 */
	public static function get_ip_block_list_count() {
		_deprecated_function( __METHOD__, 'waf-0.20.1', 'Automattic\Jetpack\Waf\Waf_Blocklog_Manager' );

		$ip_block_list = get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME );

		if ( ! $ip_block_list ) {
			return 0;
		}

		$results = IP_Utils::get_ip_addresses_from_string( $ip_block_list );

		return count( $results );
	}

	/** The global stats cache
	 *
	 * @var array|null
	 */
	public static $global_stats = null;

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

	/**
	 * Checks if the current cached global stats is expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_global_stats_cache_expired() {
		$option_timestamp = get_option( 'jetpack_protect_global_stats_timestamp' );

		if ( ! $option_timestamp ) {
			return true;
		}

		return time() > (int) $option_timestamp;
	}

	/**
	 * Checks if we should consider the stored cache or bypass it
	 *
	 * @return boolean
	 */
	public static function should_use_global_stats_cache() {
		return ! ( defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE );
	}

	/**
	 * Get the global stats from the API endpoint
	 */
	public static function fetch_global_stats_from_api() {
		$url      = esc_url_raw( 'https://public-api.wordpress.com/wpcom/v2/jetpack-protect-global-stats' );
		$response = wp_remote_get( $url );

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
			return new \WP_Error( 'failed_fetching_global_stats', 'Failed to fetch global stats data from the server', array( 'status' => $response_code ) );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );

		update_option( 'jetpack_protect_global_stats', maybe_serialize( $body ) );
		update_option( 'jetpack_protect_global_stats_timestamp', time() + 86400 ); // Caches expires after 24 hours.

		return $body;
	}

	/**
	 * Gets the current cached global stats
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_global_stats_from_options() {
		return maybe_unserialize( get_option( 'jetpack_protect_global_stats' ) );
	}

	/**
	 * Get the global stats
	 * If the cache is expired, it will fetch the data from the API
	 * If the cache is not expired, it will return the cached data
	 *
	 * @param bool $refresh_from_wpcom Whether to refresh the data from the API.
	 * @return array|\WP_Error
	 */
	public static function get_global_stats( $refresh_from_wpcom = false ) {
		if ( self::$global_stats !== null ) {
			return self::$global_stats;
		}

		if ( $refresh_from_wpcom || ! self::should_use_global_stats_cache() || self::is_global_stats_cache_expired() ) {
			$global_stats = self::fetch_global_stats_from_api();
		} else {
			$global_stats = self::get_global_stats_from_options();
		}

		// Ensure that $global_stats is of the correct type
		if ( ( ! is_object( $global_stats ) && ! ( $global_stats instanceof \WP_Error ) ) ) {
			return new \WP_Error( 'unexpected_type', 'Unexpected type or null returned for global stats' );
		}

		return $global_stats;
	}
}
