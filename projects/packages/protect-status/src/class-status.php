<?php
/**
 * Class to handle the Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Protect_Models\Status_Model;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Status {

	const PACKAGE_VERSION = '0.2.0';
	/**
	 * Name of the option where status is stored
	 *
	 * @var string
	 */
	const OPTION_NAME = '';

	/**
	 * Name of the option where the timestamp of the status is stored
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_NAME = '';

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	const OPTION_EXPIRES_AFTER = 3600; // 1 hour.

	/**
	 * Time in seconds that the cache for the initial empty response should last
	 *
	 * @var int
	 */
	const INITIAL_OPTION_EXPIRES_AFTER = 1 * MINUTE_IN_SECONDS;

	/**
	 * Memoization for the current status
	 *
	 * @var null|Status_Model
	 */
	public static $status = null;

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @param bool $refresh_from_wpcom Refresh the local plan and status cache from wpcom.
	 * @return Status_Model
	 */
	public static function get_status( $refresh_from_wpcom = false ) {
		$use_scan_status = Plan::has_required_plan();

		if ( defined( 'JETPACK_PROTECT_DEV__DATA_SOURCE' ) ) {
			if ( 'scan_api' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				$use_scan_status = true;
			}

			if ( 'protect_report' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				$use_scan_status = false;
			}
		}

		self::$status = $use_scan_status ? Scan_Status::get_status( $refresh_from_wpcom ) : Protect_Status::get_status( $refresh_from_wpcom );
		return self::$status;
	}

	/**
	 * Checks if the current cached status is expired and should be renewed
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
	 * Checks if we should consider the stored cache or bypass it
	 *
	 * @return boolean
	 */
	public static function should_use_cache() {
		return defined( 'JETPACK_PROTECT_DEV__BYPASS_CACHE' ) && JETPACK_PROTECT_DEV__BYPASS_CACHE ? false : true;
	}

	/**
	 * Gets the current cached status
	 *
	 * @return bool|array False if value is not found. Array with values if cache is found.
	 */
	public static function get_from_options() {
		return maybe_unserialize( get_option( static::OPTION_NAME ) );
	}

	/**
	 * Updated the cached status and its timestamp
	 *
	 * @param array $status The new status to be cached.
	 * @return void
	 */
	public static function update_status_option( $status ) {
		// TODO: Sanitize $status.
		update_option( static::OPTION_NAME, maybe_serialize( $status ) );
		$end_date = self::get_cache_end_date_by_status( $status );
		update_option( static::OPTION_TIMESTAMP_NAME, $end_date );
	}

	/**
	 * Returns the timestamp the cache should expire depending on the current status
	 *
	 * Initial empty status, which are returned before the first check was performed, should be cache for less time
	 *
	 * @param object $status The response from the server being cached.
	 * @return int The timestamp when the cache should expire.
	 */
	public static function get_cache_end_date_by_status( $status ) {
		if ( ! is_object( $status ) || empty( $status->last_checked ) ) {
			return time() + static::INITIAL_OPTION_EXPIRES_AFTER;
		}
		return time() + static::OPTION_EXPIRES_AFTER;
	}

	/**
	 * Delete the cached status and its timestamp
	 *
	 * @return bool Whether all related status options were successfully deleted.
	 */
	public static function delete_option() {
		$option_deleted           = delete_option( static::OPTION_NAME );
		$option_timestamp_deleted = delete_option( static::OPTION_TIMESTAMP_NAME );

		return $option_deleted && $option_timestamp_deleted;
	}

	/**
	 * Checks the current status to see if there are any threats found
	 *
	 * @return boolean
	 */
	public static function has_threats() {
		return 0 < self::get_total_threats();
	}

	/**
	 * Gets the total number of threats found
	 *
	 * @return integer
	 */
	public static function get_total_threats() {
		$status = static::get_status();
		return isset( $status->threats ) && is_array( $status->threats ) ? count( $status->threats ) : 0;
	}

	/**
	 * Get all threats combined
	 *
	 * @return array
	 */
	public static function get_all_threats() {
		$status = static::get_status();
		return isset( $status->threats ) && is_array( $status->threats ) ? $status->threats : array();
	}
}
