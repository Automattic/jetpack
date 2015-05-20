<?php
/**
 * These functions are shared by the Protect module and its related json-endpoints
 */

function jetpack_protect_format_whitelist( $whitelist = null ) {

	if( ! $whitelist ) {
		$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
	}

	$formatted = array(
		'local'         => array(), // todo remove 'local' when we merge next iteration on calypso
	);

	foreach( $whitelist as $item ) {
		if ( $item->range ) {
			$formatted['local'][] = $item->range_low . ' - ' . $item->range_high;
		} else {
			$formatted['local'][] = $item->ip_address;
		}
	}

	return $formatted;
}

function jetpack_protect_save_whitelist( $whitelist ) {
	$whitelist_error    = false;
	$new_items          = array();

	if ( ! is_array( $whitelist ) ) {
		return new WP_Error( 'invalid_parameters', __( 'Expecting an array', 'jetpack' ) );
	}

	// validate each item
	foreach( $whitelist as $item ) {

		$item = trim( $item );

		if ( empty( $item ) ) {
			continue;
		}

		$range = false;
		if ( strpos( $item, '-') ) {
			$item = explode( '-', $item );
			$range = true;
		}
		$new_item           = new stdClass();
		$new_item->range    = $range;

		if ( ! empty( $range ) ) {

			$low = trim( $item[0] );
			$high = trim( $item[1] );

			if ( ! filter_var( $low, FILTER_VALIDATE_IP ) || ! filter_var( $high, FILTER_VALIDATE_IP ) ) {
				$whitelist_error = true;
				break;
			}

			if ( ! jetpack_convert_ip_address( $low ) || ! jetpack_convert_ip_address( $high ) ) {
				$whitelist_error = true;
				break;
			}

			$new_item->range_low    = $low;
			$new_item->range_high   = $high;

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

	} // end item loop

	if ( ! empty( $whitelist_error ) ) {
		return new WP_Error( 'invalid_ip', __( 'One of your IP addresses was not valid.', 'jetpack' ) );
	}

	update_site_option( 'jetpack_protect_whitelist', $new_items );
	return true;
}

function jetpack_protect_get_ip() {
	
	$trusted_header = get_site_option( 'trusted_ip_header' );

	if( isset( $trusted_header ) && isset( $_SERVER[ $trusted_header ] ) ) {
		$ip = $_SERVER[ $trusted_header ];
	} else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}
	
	$ips = array_reverse( explode( ', ', $ip ) );
	
	$ip_list_has_nonprivate_ip = false;
	foreach( $ips as $ip ) {
		$ip = jetpack_clean_ip( $ip );
		
		// If the IP is in a private or reserved range, keep looking
		if ( $ip == '127.0.0.1' || $ip == '::1' || jetpack_protect_ip_is_private( $ip ) ) {
			continue;
		} else {
			return $ip;
		}
	}
	
	return jetpack_clean_ip( $_SERVER['REMOTE_ADDR'] );
}

function jetpack_clean_ip( $ip ) {
	$ip = trim( $ip );
	
	// Check for IPv4 IP cast as IPv6
	if ( preg_match('/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $matches ) ) {
		$ip = $matches[1];
	}
	
	return $ip;
}

/**
 * Checks an IP to see if it is within a private range
 *
 * @param int $ip
 *
 * @return bool
 */
function jetpack_protect_ip_is_private( $ip ) {

	// we are dealing with ipv6, so we can simply rely on filter_var
	if ( false === strpos( $ip, '.' ) ) {
		return !filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE );
	}

	// we are dealing with ipv4
	$private_ip4_addresses = array(
		'10.0.0.0|10.255.255.255',     // single class A network
		'172.16.0.0|172.31.255.255',   // 16 contiguous class B network
		'192.168.0.0|192.168.255.255', // 256 contiguous class C network
		'169.254.0.0|169.254.255.255', // Link-local address also referred to as Automatic Private IP Addressing
		'127.0.0.0|127.255.255.255'    // localhost
	);
	$long_ip = ip2long( $ip );
	if ( -1 != $long_ip ) {
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
 * @param $ip
 *
 * @return int|string|bool
 */
function jetpack_convert_ip_address( $ip ) {
	if ( function_exists( 'inet_pton' ) ) {
		return inet_pton( $ip );
	}
	return ip2long( $ip );
}