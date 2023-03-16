<?php
/**
 * Class for functions shared by the Brute force protection feature and its related json-endpoints
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf\Brute_Force_Protection;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use WP_Error;

/**
 * Shared Functions class.
 */
class Brute_Force_Protection_Shared_Functions {
	/**
	 * Returns an array of IP objects that will never be blocked by the Brute force protection feature
	 *
	 * The array is segmented into a local whitelist which applies only to the current site
	 * and a global whitelist which, for multisite installs, applies to the entire networko
	 *
	 * @return array
	 */
	public static function format_whitelist() {
		$local_whitelist = self::get_local_whitelist();
		$formatted       = array(
			'local' => array(),
		);
		foreach ( $local_whitelist as $item ) {
			if ( $item->range ) {
				$formatted['local'][] = $item->range_low . ' - ' . $item->range_high;
			} else {
				$formatted['local'][] = $item->ip_address;
			}
		}
		if ( is_multisite() && current_user_can( 'manage_network' ) ) {
			$formatted['global'] = array();
			$global_whitelist    = self::get_global_whitelist();
			if ( false === $global_whitelist ) {
				// If the global whitelist has never been set, check for a legacy option set prior to 3.6.
				$global_whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
			}
			foreach ( $global_whitelist as $item ) {
				if ( $item->range ) {
					$formatted['global'][] = $item->range_low . ' - ' . $item->range_high;
				} else {
					$formatted['global'][] = $item->ip_address;
				}
			}
		}
		return $formatted;
	}

	/**
	 * Gets the local Brute force protection whitelist
	 *
	 * The 'local' part of the whitelist only really applies to multisite installs,
	 * which can have a network wide whitelist, as well as a local list that applies
	 * only to the current site. On single site installs, there will only be a local
	 * whitelist.
	 *
	 * @return array A list of IP Address objects or an empty array
	 */
	public static function get_local_whitelist() {
		$whitelist = get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME );
		if ( false === $whitelist ) {
			// The local whitelist has never been set.
			if ( is_multisite() ) {
				// On a multisite, we can check for a legacy site_option that existed prior to v 3.6, or default to an empty array.
				$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
			} else {
				// On a single site, we can just use an empty array.
				$whitelist = array();
			}
		} else {
			$whitelist = IP_Utils::get_ip_addresses_from_string( $whitelist );
			$whitelist = array_map(
				function ( $ip_address ) {
					return self::create_ip_object( $ip_address );
				},
				$whitelist
			);
		}
		return $whitelist;
	}

	/**
	 * Get the global, network-wide whitelist
	 *
	 * It will revert to the legacy site_option if jetpack_protect_global_whitelist has never been set.
	 *
	 * @return array
	 */
	public static function get_global_whitelist() {
		$whitelist = get_site_option( 'jetpack_protect_global_whitelist' );
		if ( false === $whitelist ) {
			// The global whitelist has never been set. Check for legacy site_option, or default to an empty array.
			$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
		}
		return $whitelist;
	}

	/**
	 * Convert a string into an IP Address object.
	 *
	 * @param string $ip_address The IP Address to convert.
	 * @return object An IP Address object.
	 */
	private static function create_ip_object( $ip_address ) {
		$range = false;
		if ( strpos( $ip_address, '-' ) ) {
			$ip_address = explode( '-', $ip_address );
			$range      = true;
		}
		$new_item        = new \stdClass();
		$new_item->range = $range;
		if ( $range ) {
			$new_item->range_low  = trim( $ip_address[0] );
			$new_item->range_high = trim( $ip_address[1] );
		} else {
			$new_item->ip_address = $ip_address;
		}
		return $new_item;
	}

	/**
	 * Save Whitelist.
	 *
	 * @access public
	 * @param mixed $whitelist Whitelist.
	 * @param bool  $global (default: false) Global.
	 * @return Bool.
	 */
	public static function save_whitelist( $whitelist, $global = false ) {
		$whitelist_error = false;
		$new_items       = array();
		if ( ! is_array( $whitelist ) ) {
			return new WP_Error( 'invalid_parameters', __( 'Expecting an array', 'jetpack-waf' ) );
		}
		if ( $global && ! is_multisite() ) {
			return new WP_Error( 'invalid_parameters', __( 'Cannot use global flag on non-multisites', 'jetpack-waf' ) );
		}
		if ( $global && ! current_user_can( 'manage_network' ) ) {
			return new WP_Error( 'permission_denied', __( 'Only super admins can edit the global whitelist', 'jetpack-waf' ) );
		}
		// Validate each item.
		foreach ( $whitelist as $item ) {
			$item = trim( $item );
			if ( empty( $item ) ) {
				continue;
			}
			$new_item = self::create_ip_object( $item );
			if ( $new_item->range ) {
				if ( ! filter_var( $new_item->range_low, FILTER_VALIDATE_IP ) || ! filter_var( $new_item->range_high, FILTER_VALIDATE_IP ) ) {
					$whitelist_error = true;
					break;
				}
				if ( ! IP_Utils::convert_ip_address( $new_item->range_low ) || ! IP_Utils::convert_ip_address( $new_item->range_high ) ) {
					$whitelist_error = true;
					break;
				}
			} else {
				if ( ! filter_var( $new_item->ip_address, FILTER_VALIDATE_IP ) ) {
					$whitelist_error = true;
					break;
				}
				if ( ! IP_Utils::convert_ip_address( $new_item->ip_address ) ) {
					$whitelist_error = true;
					break;
				}
			}
			$new_items[] = $new_item;
		} // End item loop.
		if ( ! empty( $whitelist_error ) ) {
			return new WP_Error( 'invalid_ip', __( 'One of your IP addresses was not valid.', 'jetpack-waf' ) );
		}
		if ( $global ) {
			update_site_option( 'jetpack_protect_global_whitelist', $new_items );
			// Once a user has saved their global whitelist, we can permanently remove the legacy option.
			delete_site_option( 'jetpack_protect_whitelist' );
		} else {
			$new_items = array_map(
				function ( $item ) {
					if ( $item->range ) {
							return $item->range_low . '-' . $item->range_high;
					}
					return $item->ip_address;
				},
				$new_items
			);
			update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, implode( ' ', $new_items ) );
		}
		return true;
	}
}
