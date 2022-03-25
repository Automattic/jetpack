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
			if ( ! jetpack_convert_ip_address( $low ) || ! jetpack_convert_ip_address( $high ) ) {
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
			if ( ! jetpack_convert_ip_address( $item ) ) {
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

/**
 * Jetpack Protect Get IP.
 *
 * @access public
 * @return string|false IP.
 */
function jetpack_protect_get_ip() {
	$trusted_header_data = get_site_option( 'trusted_ip_header' );
	if ( isset( $trusted_header_data->trusted_header ) && isset( $_SERVER[ $trusted_header_data->trusted_header ] ) ) {
		$ip            = $_SERVER[ $trusted_header_data->trusted_header ];
		$segments      = $trusted_header_data->segments;
		$reverse_order = $trusted_header_data->reverse;
	} else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}

	if ( ! $ip ) {
		return false;
	}

	$ips = explode( ',', $ip );
	if ( ! isset( $segments ) || ! $segments ) {
		$segments = 1;
	}
	if ( isset( $reverse_order ) && $reverse_order ) {
		$ips = array_reverse( $ips );
	}
	$ip_count = count( $ips );
	if ( 1 === $ip_count ) {
		return jetpack_clean_ip( $ips[0] );
	} elseif ( $ip_count >= $segments ) {
		$the_one = $ip_count - $segments;
		return jetpack_clean_ip( $ips[ $the_one ] );
	} else {
		return jetpack_clean_ip( $_SERVER['REMOTE_ADDR'] );
	}
}

/**
 * Jetpack Clean IP.
 *
 * @access public
 * @param string $ip IP.
 * @return string|false IP.
 */
function jetpack_clean_ip( $ip ) {

	// Some misconfigured servers give back extra info, which comes after "unless".
	$ips = explode( ' unless ', $ip );
	$ip  = $ips[0];

	$ip = strtolower( trim( $ip ) );

	// Check for IPv4 with port.
	if ( preg_match( '/^(\d+\.\d+\.\d+\.\d+):\d+$/', $ip, $matches ) ) {
		$ip = $matches[1];
	}

	// Check for IPv6 (or IPvFuture) with brackets and optional port.
	if ( preg_match( '/^\[([a-z0-9\-._~!$&\'()*+,;=:]+)\](?::\d+)?$/', $ip, $matches ) ) {
		$ip = $matches[1];
	}

	// Check for IPv4 IP cast as IPv6.
	if ( preg_match( '/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $matches ) ) {
		$ip = $matches[1];
	}

	// Validate and return.
	return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : false;
}

/**
 * Checks an IP to see if it is within a private range.
 *
 * @param int $ip IP.
 * @return bool
 */
function jetpack_protect_ip_is_private( $ip ) {
	// We are dealing with ipv6, so we can simply rely on filter_var.
	if ( false === strpos( $ip, '.' ) ) {
		return ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE );
	}
	// We are dealing with ipv4.
	$private_ip4_addresses = array(
		'10.0.0.0|10.255.255.255',     // Single class A network.
		'172.16.0.0|172.31.255.255',   // 16 contiguous class B network.
		'192.168.0.0|192.168.255.255', // 256 contiguous class C network.
		'169.254.0.0|169.254.255.255', // Link-local address also referred to as Automatic Private IP Addressing.
		'127.0.0.0|127.255.255.255',    // localhost.
	);
	$long_ip               = ip2long( $ip );
	if ( -1 !== $long_ip ) {
		foreach ( $private_ip4_addresses as $pri_addr ) {
			list ( $start, $end ) = explode( '|', $pri_addr );
			if ( $long_ip >= ip2long( $start ) && $long_ip <= ip2long( $end ) ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Uses inet_pton if available to convert an IP address to a binary string.
 * If inet_pton is not available, ip2long will convert the address to an integer.
 * Returns false if an invalid IP address is given.
 *
 * NOTE: ip2long will return false for any ipv6 address. servers that do not support
 * inet_pton will not support ipv6
 *
 * @access public
 * @param mixed $ip IP.
 * @return int|string|bool
 */
function jetpack_convert_ip_address( $ip ) {
	if ( function_exists( 'inet_pton' ) ) {
		return inet_pton( $ip );
	}
	return ip2long( $ip );
}

/**
 * Checks that a given IP address is within a given low - high range.
 * Servers that support inet_pton will use that function to convert the ip to number,
 * while other servers will use ip2long.
 *
 * NOTE: servers that do not support inet_pton cannot support ipv6.
 *
 * @access public
 * @param mixed $ip IP.
 * @param mixed $range_low Range Low.
 * @param mixed $range_high Range High.
 * @return Bool.
 */
function jetpack_protect_ip_address_is_in_range( $ip, $range_low, $range_high ) {
	// The inet_pton will give us binary string of an ipv4 or ipv6.
	// We can then use strcmp to see if the address is in range.
	if ( function_exists( 'inet_pton' ) ) {
		$ip_num  = inet_pton( $ip );
		$ip_low  = inet_pton( $range_low );
		$ip_high = inet_pton( $range_high );
		if ( $ip_num && $ip_low && $ip_high && strcmp( $ip_num, $ip_low ) >= 0 && strcmp( $ip_num, $ip_high ) <= 0 ) {
			return true;
		}
		// The ip2long will give us an integer of an ipv4 address only. it will produce FALSE for ipv6.
	} else {
		$ip_num  = ip2long( $ip );
		$ip_low  = ip2long( $range_low );
		$ip_high = ip2long( $range_high );
		if ( $ip_num && $ip_low && $ip_high && $ip_num >= $ip_low && $ip_num <= $ip_high ) {
			return true;
		}
	}
	return false;
}
