<?php
/**
 * Class to handle the Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Jetpack_Plan;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Status {
	/**
	 * Name of the option where status is stored
	 *
	 * @var string
	 */
	protected static $option_name;

	/**
	 * Name of the option where the timestamp of the status is stored
	 *
	 * @var string
	 */
	protected static $option_timestamp_name;

	/**
	 * Time in seconds that the cache should last
	 *
	 * @var int
	 */
	protected static $option_expires_after = 3600; // 1 hour.

	/**
	 * Time in seconds that the cache for the initial empty response should last
	 *
	 * @var int
	 */
	protected static $initial_option_expires_after = 1 * MINUTE_IN_SECONDS;

	/**
	 * Memoization for the current status
	 *
	 * @var null|Status_Model
	 */
	public static $status = null;

	/**
	 * Gets the current status of the Jetpack Protect checks
	 *
	 * @return Status_Model
	 */
	public static function get_status() {
		$use_scan_status = class_exists( 'Jetpack_Plan' ) && Jetpack_Plan::supports( 'scan' );

		if ( defined( 'JETPACK_PROTECT_DEV__DATA_SOURCE' ) ) {
			if ( 'scan_api' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				$use_scan_status = true;
			}

			if ( 'protect_report' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				$use_scan_status = false;
			}
		}

		self::$status = $use_scan_status ? Scan_Status::get_status() : Protect_Status::get_status();
		return self::$status;
	}

	/**
	 * Checks if the current cached status is expired and should be renewed
	 *
	 * @return boolean
	 */
	public static function is_cache_expired() {
		$option_timestamp = get_option( static::$option_timestamp_name );

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
		return get_option( static::$option_name );
	}

	/**
	 * Updated the cached status and its timestamp
	 *
	 * @param array $status The new status to be cached.
	 * @return void
	 */
	public static function update_option( $status ) {
		// TODO: Sanitize $status.
		update_option( static::$option_name, $status );
		$end_date = self::get_cache_end_date_by_status( $status );
		update_option( static::$option_timestamp_name, $end_date );
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
			return time() + static::$initial_option_expires_after;
		}
		return time() + static::$option_expires_after;
	}

	/**
	 * Delete the cached status and its timestamp
	 *
	 * @return void
	 */
	public static function delete_option() {
		delete_option( static::$option_name );
		delete_option( static::$option_timestamp_name );
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
		$status = self::get_status();
		return isset( $status->num_threats ) && is_int( $status->num_threats ) ? $status->num_threats : 0;
	}

	/**
	 * Get all threats combined
	 *
	 * @return array
	 */
	public static function get_all_threats() {
		return array_merge(
			self::get_wordpress_threats(),
			self::get_themes_threats(),
			self::get_plugins_threats()
		);
	}

	/**
	 * Get threats found for WordPress core
	 *
	 * @return array
	 */
	public static function get_wordpress_threats() {
		return self::get_threats( 'core' );
	}

	/**
	 * Get threats found for themes
	 *
	 * @return array
	 */
	public static function get_themes_threats() {
		return self::get_threats( 'themes' );
	}

	/**
	 * Get threats found for plugins
	 *
	 * @return array
	 */
	public static function get_plugins_threats() {
		return self::get_threats( 'plugins' );
	}

	/**
	 * Get the threats for one type of extension or core
	 *
	 * @param string $type What threats you want to get. Possible values are 'core', 'themes' and 'plugins'.
	 *
	 * @return array
	 */
	public static function get_threats( $type ) {
		$status = self::get_status();
		if ( 'core' === $type ) {
			return isset( $status->$type ) && ! empty( $status->$type->threats ) ? $status->$type->threats : array();
		}

		$threats = array();
		if ( isset( $status->$type ) ) {
			foreach ( (array) $status->$type as $item ) {
				if ( ! empty( $item->threats ) ) {
					$threats = array_merge( $threats, $item->threats );
				}
			}
		}
		return $threats;
	}

	/**
	 * Check if the WordPress version that was checked matches the current installed version.
	 *
	 * @param object $core_check The object returned by Protect wpcom endpoint.
	 * @return object The object representing the current status of core checks.
	 */
	protected static function normalize_core_information( $core_check ) {
		global $wp_version;

		$core = new Extension_Model(
			array(
				'type'    => 'core',
				'name'    => 'WordPress',
				'version' => $wp_version,
				'checked' => false,
			)
		);

		if ( isset( $core_check->version ) && $core_check->version === $wp_version ) {
			if ( is_array( $core_check->vulnerabilities ) ) {
				$core->checked = true;
				$core->set_threats( $core_check->vulnerabilities );
			}
		}

		return $core;
	}

	/**
	 * Sort By Threats
	 *
	 * @param array<object> $threats Array of threats to sort.
	 *
	 * @return array<object> The sorted $threats array.
	 */
	protected static function sort_threats( $threats ) {
		usort(
			$threats,
			function ( $a, $b ) {
				// sort primarily based on the presence of threats
				if ( ! empty( $a->threats ) && empty( $b->threats ) ) {
					return -1;
				}
				if ( empty( $a->threats ) && ! empty( $b->threats ) ) {
					return 1;
				}
				// sort secondarily on whether the item has been checked
				if ( $a->checked && ! $b->checked ) {
					return 1;
				}
				if ( ! $a->checked && $b->checked ) {
					return -1;
				}

				return 0;
			}
		);

		return $threats;
	}

}
