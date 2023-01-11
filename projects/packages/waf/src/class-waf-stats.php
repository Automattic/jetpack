<?php
/**
 * Class used to retrieve WAF stats
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Retrieves WAF stats.
 */
class Waf_Stats {

	/**
	 * Get IP allow list count
	 *
	 * @return integer The number of valid IP addresses in the block list
	 */
	public static function get_ip_allow_list_count() {
		$ip_allow_list = get_option( Waf_Runner::IP_ALLOW_LIST_OPTION_NAME );

		if ( ! $ip_allow_list ) {
			return 0;
		}

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

		if ( ! $ip_block_list ) {
			return 0;
		}

		$results = Waf_Runner::ip_option_to_array( $ip_block_list );

		return count( $results );
	}

	/**
	 * Get Rules version
	 *
	 * @return bool|string False if value is not found. The current stored rules version if cache is found.
	 */
	public static function get_rules_version() {
		return get_option( Waf_Runner::VERSION_OPTION_NAME );
	}

	/**
	 * Get Automatic Rules last updated timestamp
	 *
	 * @return bool|string False if value is not found. The timestamp the current stored rules was last updated if cache is found.
	 */
	public static function get_automatic_rules_last_updated() {
		return get_option( Waf_Runner::AUTOMATIC_RULES_LAST_UPDATED_OPTION_NAME );
	}
}
