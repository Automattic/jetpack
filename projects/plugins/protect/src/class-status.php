<?php
/**
 * Class to handle the Status of Jetpack Protect
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Class that handles fetching and caching the Status of vulnerabilities check from the WPCOM servers
 */
class Status {
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
		if ( defined( 'JETPACK_PROTECT_DEV__DATA_SOURCE' ) ) {
			if ( 'scan_api' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				self::$status = Scan_Status::get_status();
				return self::$status;
			}

			if ( 'protect_report' === JETPACK_PROTECT_DEV__DATA_SOURCE ) {
				self::$status = Protect_Status::get_status();
				return self::$status;
			}
		}

		$has_scan_plan = \Jetpack_Plan::supports( 'scan' );
		self::$status  = $has_scan_plan ? Scan_Status::get_status() : Protect_Status::get_status();
		return self::$status;
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
