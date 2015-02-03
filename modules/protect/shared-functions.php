<?php
/**
 * This functions are shared by the Protect module and its related json-endpoints
 */

if ( ! function_exists( 'jetpack_protect_format_whitelist' ) ) {
	function jetpack_protect_format_whitelist( $whitelist = null ) {

		if( ! $whitelist ) {
			$whitelist = get_site_option( 'jetpack_protect_whitelist', array() );
		}

		global $current_user;
		$current_user_whitelist = wp_list_filter( $whitelist, array( 'user_id' => $current_user->ID, 'global'=>false ) );
		$current_user_global_whitelist = wp_list_filter( $whitelist, array( 'user_id' => $current_user->ID, 'global'=> true) );
		$other_user_whtielist = wp_list_filter( $whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
		$formatted = array(
			'local'         => array(),
			'global'        => array(),
			'other_user'    => array(),
		);
		foreach( $current_user_whitelist as $item ) {
			if ( $item->range ) {
				$formatted['local'][] = $item->range_low . ' - ' . $item->range_high;
			} else {
				$formatted['local'][] = $item->ip_address;
			}
		}

		foreach( $current_user_global_whitelist as $item ) {
			if ( $item->range ) {
				$formatted['global'][] = $item->range_low . ' - ' . $item->range_high;
			} else {
				$formatted['global'][] = $item->ip_address;
			}
		}

		foreach( $other_user_whtielist as $item ) {
			if ( $item->range ) {
				$formatted['other_user'][] = $item->range_low . ' - ' . $item->range_high;
			} else {
				$formatted['other_user'][] = $item->ip_address;
			}
		}

		$formatted['local']         = implode( PHP_EOL, $formatted['local'] );
		$formatted['global']        = implode( PHP_EOL, $formatted['global'] );
		$formatted['other_user']    = implode( PHP_EOL, $formatted['other_user'] );

		return $formatted;
	}
}

if ( ! function_exists( 'jetpack_protect_save_whitelist' ) ) {
	function jetpack_protect_save_whitelist( $whitelist, $global ) {
		global $current_user;
		$whitelist_error    = false;
		$whitelist          = str_replace( ' ', '', $whitelist );
		$whitelist          = explode( PHP_EOL, $whitelist);
		$new_items          = array();
		$global             = (bool) $global;

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
			$new_item->global   = $global;
			$new_item->user_id  = $current_user->ID;

			if ( ! empty( $range ) ) {

				$low = trim( $item[0] );
				$high = trim( $item[1] );

				if ( ! inet_pton( $low ) || ! inet_pton( $high ) ) {
					$whitelist_error = true;
					break;
				}

				$new_item->range_low    = $low;
				$new_item->range_high   = $high;
			} else {

				if ( ! inet_pton( $item ) ) {
					$whitelist_error = true;
					break;
				}
				$new_item->ip_address = $item;
			}

			$new_items[] = $new_item;

		} // end item loop

		if ( ! empty( $whitelist_error ) ) {
			return false;
		}

		// merge new items with un-editable items
		$existing_whitelist     = get_site_option( 'jetpack_protect_whitelist', array() );
		$current_user_whitelist = wp_list_filter( $existing_whitelist, array( 'user_id' => $current_user->ID, 'global'=> ! $global ) );
		$other_user_whtielist   = wp_list_filter( $existing_whitelist, array( 'user_id' => $current_user->ID ), 'NOT' );
		$new_whitelist          = array_merge( $new_items, $current_user_whitelist, $other_user_whtielist );

		update_site_option( 'jetpack_protect_whitelist', $new_whitelist );
		return true;
	}
}

if ( ! function_exists( 'jetpack_protect_get_ip' ) ) {
	function jetpack_protect_get_ip() {

		$server_headers = array(
			'HTTP_CLIENT_IP',
			'HTTP_CF_CONNECTING_IP',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_FORWARDED',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_FORWARDED_FOR',
			'HTTP_FORWARDED',
			'REMOTE_ADDR'
		);

		foreach( $server_headers as $key ) {

			if ( ! array_key_exists( $key, $_SERVER ) ) {
				continue;
			}

			foreach( explode( ',', $_SERVER[ $key ] ) as $ip ) {
				$ip = trim( $ip ); // just to be safe

				// Check for IPv4 IP cast as IPv6
				if ( preg_match('/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $matches ) ) {
					$ip = $matches[1];
				}

				// If the IP is in a private or reserved range, return REMOTE_ADDR to help prevent spoofing
				if ( $ip == '127.0.0.1' || $ip == '::1' || jetpack_protect_ip_is_private( $ip ) ) {
					return $_SERVER[ 'REMOTE_ADDR' ];
				}
				return $ip;
			}
		}
	}
}

if ( ! function_exists( 'jetpack_protect_ip_is_private' ) ) {


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
}