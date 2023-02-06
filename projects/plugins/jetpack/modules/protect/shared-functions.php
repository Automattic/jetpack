<?php
/**
 * These functions are shared by the Protect module and its related json-endpoints
 *
 * @package automattic/jetpack
 */

/**
 * Returns an array of IP objects that will never be blocked by the Protect module
 *
 * The array is segmented into a local whitelist which applies only to the current site
 * and a global whitelist which, for multisite installs, applies to the entire networko
 *
 * @return array
 */
function jetpack_protect_format_whitelist() {
	$local_whitelist = jetpack_protect_get_local_whitelist();
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
		$global_whitelist    = jetpack_protect_get_global_whitelist();
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
 * Gets the local Protect whitelist
 *
 * The 'local' part of the whitelist only really applies to multisite installs,
 * which can have a network wide whitelist, as well as a local list that applies
 * only to the current site. On single site installs, there will only be a local
 * whitelist.
 *
 * @return array A list of IP Address objects or an empty array
 */
function jetpack_protect_get_local_whitelist() {
	$whitelist = Jetpack_Options::get_option( 'protect_whitelist' );
	if ( false === $whitelist ) {
		// The local whitelist has never been set.
		if ( is_multisite() ) {
			// On a multisite, we can check for a legacy site_option that existed prior to v 3.6, or default to an empty array.
			$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
		} else {
			// On a single site, we can just use an empty array.
			$whitelist = array();
		}
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
function jetpack_protect_get_global_whitelist() {
	$whitelist = get_site_option( 'jetpack_protect_global_whitelist' );
	if ( false === $whitelist ) {
		// The global whitelist has never been set. Check for legacy site_option, or default to an empty array.
		$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
	}
	return $whitelist;
}

/**
 * Jetpack Protect Save Whitelist.
 *
 * @access public
 * @param mixed $whitelist Whitelist.
 * @param bool  $global (default: false) Global.
 * @return Bool.
 */
function jetpack_protect_save_whitelist( $whitelist, $global = false ) {
	$whitelist_error = false;
	$new_items       = array();
	if ( ! is_array( $whitelist ) ) {
		return new WP_Error( 'invalid_parameters', __( 'Expecting an array', 'jetpack' ) );
	}
	if ( $global && ! is_multisite() ) {
		return new WP_Error( 'invalid_parameters', __( 'Cannot use global flag on non-multisites', 'jetpack' ) );
	}
	if ( $global && ! current_user_can( 'manage_network' ) ) {
		return new WP_Error( 'permission_denied', __( 'Only super admins can edit the global whitelist', 'jetpack' ) );
	}
	// Validate each item.
	foreach ( $whitelist as $item ) {
		$item = trim( $item );
		if ( empty( $item ) ) {
			continue;
		}
		$range = false;
		if ( strpos( $item, '-' ) ) {
			$item  = explode( '-', $item );
			$range = true;
		}
		$new_item        = new stdClass();
		$new_item->range = $range;
		if ( ! empty( $range ) ) {
			$low  = trim( $item[0] );
			$high = trim( $item[1] );
			if ( ! filter_var( $low, FILTER_VALIDATE_IP ) || ! filter_var( $high, FILTER_VALIDATE_IP ) ) {
				$whitelist_error = true;
				break;
			}
			if ( ! IP::convert_ip_address( $low ) || ! IP::convert_ip_address( $high ) ) {
				$whitelist_error = true;
				break;
			}
			$new_item->range_low  = $low;
			$new_item->range_high = $high;
		} else {
			if ( ! filter_var( $item, FILTER_VALIDATE_IP ) ) {
				$whitelist_error = true;
				break;
			}
			if ( ! IP::convert_ip_address( $item ) ) {
				$whitelist_error = true;
				break;
			}
			$new_item->ip_address = $item;
		}
		$new_items[] = $new_item;
	} // End item loop.
	if ( ! empty( $whitelist_error ) ) {
		return new WP_Error( 'invalid_ip', __( 'One of your IP addresses was not valid.', 'jetpack' ) );
	}
	if ( $global ) {
		update_site_option( 'jetpack_protect_global_whitelist', $new_items );
		// Once a user has saved their global whitelist, we can permanently remove the legacy option.
		delete_site_option( 'jetpack_protect_whitelist' );
	} else {
		Jetpack_Options::update_option( 'protect_whitelist', $new_items );
	}
	return true;
}
