<?php
/**
 * IP Address Class
 *
 * @package automattic/jetpack-ip
 */

namespace Automattic\Jetpack\IP;

/**
 * Static class that provides utility methods for working with IP addresses.
 */
class IP {

	/**
	 * Get the current user's IP address.
	 *
	 * @return string|false IP address.
	 */
	public static function get_ip() {
		$trusted_header_data = get_site_option( 'trusted_ip_header' );
		if ( isset( $trusted_header_data->trusted_header ) && isset( $_SERVER[ $trusted_header_data->trusted_header ] ) ) {
			$ip            = wp_unslash( $_SERVER[ $trusted_header_data->trusted_header ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- clean_ip does it below.
			$segments      = $trusted_header_data->segments;
			$reverse_order = $trusted_header_data->reverse;
		} else {
			$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- clean_ip does it below.
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
			return self::clean_ip( $ips[0] );
		} elseif ( $ip_count >= $segments ) {
			$the_one = $ip_count - $segments;
			return self::clean_ip( $ips[ $the_one ] );
		} else {
			return self::clean_ip( isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- clean_ip does it.
		}
	}

	/**
	 * Clean IP address.
	 *
	 * @param string $ip The IP address to clean.
	 * @return string|false The cleaned IP address.
	 */
	public static function clean_ip( $ip ) {

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
	 * @param int $ip IP address.
	 * @return bool True if IP address is private, false otherwise.
	 */
	public static function ip_is_private( $ip ) {
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
	 * @param mixed $ip IP address.
	 * @return int|string|bool
	 */
	public static function convert_ip_address( $ip ) {
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
	 * @param mixed $ip IP.
	 * @param mixed $range_low Range Low.
	 * @param mixed $range_high Range High.
	 * @return Bool
	 */
	public static function ip_address_is_in_range( $ip, $range_low, $range_high ) {
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

}
