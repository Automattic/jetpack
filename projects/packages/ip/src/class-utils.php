<?php
/**
 * Utils class file.
 *
 * @package automattic/jetpack-ip
 */

namespace Automattic\Jetpack\IP;

/**
 * Class that provides static methods for working with IP addresses.
 */
class Utils {

	const PACKAGE_VERSION = '0.4.3';

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
		// Note: str_contains() is not used here, as wp-includes/compat.php may not be loaded in this file.
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
	 * Validate an IP address.
	 *
	 * @param string $ip IP address.
	 * @return bool True if valid, false otherwise.
	 */
	private static function validate_ip_address( string $ip ) {
		return filter_var( $ip, FILTER_VALIDATE_IP );
	}

	/**
	 * Validate an array of IP addresses.
	 *
	 * @param array $ips List of IP addresses.
	 * @return bool True if all IPs are valid, false otherwise.
	 */
	private static function validate_ip_addresses( array $ips ) {
		foreach ( $ips as $ip ) {
			if ( ! self::validate_ip_address( $ip ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Uses inet_pton if available to convert an IP address to a binary string.
	 * Returns false if an invalid IP address is given.
	 *
	 * @param mixed $ip IP address.
	 * @return int|string|bool
	 */
	public static function convert_ip_address( $ip ) {
		return inet_pton( $ip );
	}

	/**
	 * Determines the IP version of the given IP address.
	 *
	 * @param string $ip IP address.
	 * @return string|false 'ipv4', 'ipv6', or false if invalid.
	 */
	public static function get_ip_version( $ip ) {
		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			return 'ipv4';
		} elseif ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
			return 'ipv6';
		} else {
			return false;
		}
	}

	/**
	 * Extracts IP addresses from a given string.
	 *
	 * Supports IPv4 and IPv6 ranges in both hyphen and CIDR notation.
	 *
	 * @param string $ips List of IPs.
	 * @return array List of valid IP addresses or ranges.
	 */
	public static function get_ip_addresses_from_string( $ips ) {
		// Split the string by spaces, commas, and semicolons.
		$ips = preg_split( '/[\s,;]/', (string) $ips );

		$result = array();

		foreach ( $ips as $ip ) {
			$ip = trim( $ip );

			// Check for CIDR notation
			if ( strpos( $ip, '/' ) !== false ) {
				if ( self::validate_cidr( $ip ) ) {
					$result[] = $ip;
				}
				continue;
			}

			// Validate both IP values from the hyphen range.
			$range = explode( '-', $ip );
			if ( count( $range ) === 2 ) {
				if ( self::validate_ip_range( $range[0], $range[1] ) ) {
					$result[] = $ip;
				}
				continue;
			}

			// Validate the single IP value.
			if ( filter_var( $ip, FILTER_VALIDATE_IP ) !== false ) {
				$result[] = $ip;
			}
		}

		return $result;
	}

	/**
	 * Validates CIDR notation for IPv4 and IPv6 addresses.
	 *
	 * @param string $cidr CIDR notation IP address.
	 * @return bool True if valid, false otherwise.
	 */
	public static function validate_cidr( $cidr ) {
		// Split the CIDR notation into IP address and prefix length using the '/' separator.
		$parts = explode( '/', $cidr );
		if ( count( $parts ) !== 2 ) {
			return false; // Invalid CIDR notation if it doesn't contain exactly one '/'.
		}

		list( $ip, $netmask ) = $parts;

		// Validate the IP address.
		if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return false;
		}

		$ip_version = self::get_ip_version( $ip );
		if ( ! $ip_version ) {
			return false; // Invalid IP address.
		}

		// Validate the netmask based on the IP version.
		if ( ! self::validate_netmask( $netmask, $ip_version ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Checks if an IP address is within a CIDR range.
	 * Supports both IPv4 and IPv6.
	 *
	 * @param string $ip   IP address.
	 * @param string $cidr CIDR notation IP range.
	 * @return bool True if IP is within the range, false otherwise.
	 */
	public static function ip_in_cidr( $ip, $cidr ) {
		// Parse the CIDR notation to extract the base IP address and netmask prefix length.
		$parsed_cidr = self::parse_cidr( $cidr );
		if ( ! $parsed_cidr ) {
			return false;
		}
		list( $range, $netmask ) = $parsed_cidr;

		// Determine the IP version (IPv4 or IPv6) of both the input IP and the CIDR range IP.
		$ip_version    = self::get_ip_version( $ip );
		$range_version = self::get_ip_version( $range );

		// Ensure both IP addresses are valid and of the same IP version.
		if ( ! $ip_version || ! $range_version || $ip_version !== $range_version ) {
			return false;
		}

		// Validate the netmask based on the IP version.
		if ( ! self::validate_netmask( $netmask, $ip_version ) ) {
			return false;
		}

		if ( $ip_version === 'ipv4' ) {
			return self::ip_in_ipv4_cidr( $ip, $range, $netmask );
		} else {
			return self::ip_in_ipv6_cidr( $ip, $range, $netmask );
		}
	}

	/**
	 * Parses the CIDR notation into network address and netmask.
	 *
	 * @param string $cidr CIDR notation IP range.
	 * @return array|false Array containing network address and netmask, or false on failure.
	 */
	public static function parse_cidr( $cidr ) {
		$cidr_parts = explode( '/', $cidr, 2 );
		if ( count( $cidr_parts ) !== 2 ) {
			return false; // Invalid CIDR notation
		}
		list( $range, $netmask ) = $cidr_parts;

		// Determine IP version
		$ip_version = self::get_ip_version( $range );
		if ( ! $ip_version ) {
			return false; // Invalid IP address
		}

		// Validate netmask range
		if ( ! self::validate_netmask( $netmask, $ip_version ) ) {
			return false; // Netmask out of range
		}

		return array( $range, (int) $netmask );
	}

	/**
	 * Validates the netmask based on IP version.
	 *
	 * @param string|int $netmask    Netmask value.
	 * @param string     $ip_version 'ipv4' or 'ipv6'.
	 * @return bool True if valid, false otherwise.
	 */
	public static function validate_netmask( $netmask, $ip_version ) {
		// Ensure that $netmask is an integer
		if ( ! ctype_digit( (string) $netmask ) ) {
			return false;
		}
		$netmask = (int) $netmask;

		// Validate the netmask based on the IP version.
		if ( $ip_version === 'ipv4' ) {
			return ( $netmask >= 0 && $netmask <= 32 );
		} elseif ( $ip_version === 'ipv6' ) {
			return ( $netmask >= 0 && $netmask <= 128 );
		} else {
			return false;
		}
	}

	/**
	 * Checks if an IPv4 address is within a CIDR range.
	 *
	 * @param string $ip      IPv4 address to check.
	 * @param string $range   IPv4 network address.
	 * @param int    $netmask Netmask value.
	 * @return bool True if IP is within the range, false otherwise.
	 */
	public static function ip_in_ipv4_cidr( $ip, $range, $netmask ) {
		// Validate arguments.
		if ( ! self::validate_ip_addresses( array( $ip, $range ) ) || ! self::validate_netmask( $netmask, 'ipv4' ) ) {
			return false; // Invalid IP address or netmask.
		}

		// Convert IP addresses from their dotted representation to 32-bit unsigned integers.
		$ip_long    = ip2long( $ip );
		$range_long = ip2long( $range );

		// Check if the conversion was successful.
		if ( $ip_long === false || $range_long === false ) {
			return false; // One of the IP addresses is invalid.
		}

		/**
		 * Create the subnet mask as a 32-bit unsigned integer.
		 *
		 * Explanation:
		 * - (32 - $netmask) calculates the number of host bits (the bits not used for the network address).
		 * - (1 << (32 - $netmask)) shifts the number 1 left by the number of host bits.
		 *   This results in a number where there is a single 1 followed by zeros equal to the number of host bits.
		 * - Subtracting 1 gives us a number where the host bits are all 1s.
		 * - Applying the bitwise NOT operator (~) inverts the bits, turning all host bits to 0 and network bits to 1.
		 *   This results in the subnet mask having 1s in the network portion and 0s in the host portion.
		 *
		 * Example for netmask = 24:
		 * - (32 - 24) = 8
		 * - (1 << 8) = 256 (binary: 00000000 00000000 00000001 00000000)
		 * - 256 - 1 = 255 (binary: 00000000 00000000 00000000 11111111)
		 * - ~255 = 4294967040 (binary: 11111111 11111111 11111111 00000000)
		 */
		$mask = ~ ( ( 1 << ( 32 - $netmask ) ) - 1 );

		/**
		 * Use bitwise AND to apply the subnet mask to both the IP address and the network address.
		 * - ($ip_long & $mask) isolates the network portion of the IP address.
		 * - ($range_long & $mask) isolates the network portion of the CIDR range.
		 * - If both network portions are equal, the IP address belongs to the same subnet and is within the CIDR range.
		 */
		return ( $ip_long & $mask ) === ( $range_long & $mask );
	}

	/**
	 * Checks if an IPv6 address is within a CIDR range.
	 *
	 * @param string $ip      IPv6 address to check.
	 * @param string $range   IPv6 network address.
	 * @param int    $netmask Netmask value.
	 * @return bool True if IP is within the range, false otherwise.
	 */
	public static function ip_in_ipv6_cidr( $ip, $range, $netmask ) {
		// Validate arguments.
		if ( ! self::validate_ip_addresses( array( $ip, $range ) ) || ! self::validate_netmask( $netmask, 'ipv6' ) ) {
			return false; // Invalid IP address or netmask.
		}

		// Convert IP addresses from their textual representation to binary strings.
		$ip_bin    = inet_pton( $ip );
		$range_bin = inet_pton( $range );

		// Check if the conversion was successful.
		if ( $ip_bin === false || $range_bin === false ) {
			return false; // One of the IP addresses is invalid.
		}

		/**
		 * Calculate the subnet mask in binary form.
		 *
		 * IPv6 addresses are 128 bits long.
		 * The netmask defines how many bits are set to 1 in the subnet mask.
		 *
		 * - $netmask_full_bytes: Number of full bytes (each 8 bits) that are all 1s.
		 * - $netmask_remainder_bits: Remaining bits (less than 8) that need to be set to 1.
		 *
		 * For example, if $netmask = 65:
		 * - $netmask_full_bytes = floor(65 / 8) = 8 (since 8 * 8 = 64 bits)
		 * - $netmask_remainder_bits = 65 % 8 = 1 (1 bit remaining)
		 *
		 * We'll construct the subnet mask by:
		 * - Starting with $netmask_full_bytes of 0xff (11111111 in binary).
		 * - Adding a byte where the first $netmask_remainder_bits bits are 1, rest are 0.
		 * - Padding the rest with zeros to make it 16 bytes (128 bits) long.
		 */

		// Number of full bytes (each full byte is 8 bits) in the netmask.
		$netmask_full_bytes = (int) ( $netmask / 8 );

		// Number of remaining bits in the last byte of the netmask.
		$netmask_remainder_bits = $netmask % 8;

		// Start with a string of $netmask_full_bytes of 0xff bytes (each byte is 8 bits set to 1).
		$netmask_bin = str_repeat( "\xff", $netmask_full_bytes );

		if ( $netmask_remainder_bits > 0 ) {
			// Create the last byte with $netmask_remainder_bits bits set to 1 from the left.
			// - str_repeat('1', $netmask_remainder_bits): creates a string with the required number of '1's.
			// - str_pad(...): pads the string on the right with '0's to make it 8 bits.
			// - bindec(...): converts the binary string to a decimal number.
			// - chr(...): gets the character corresponding to the byte value.
			$last_byte = chr( bindec( str_pad( str_repeat( '1', $netmask_remainder_bits ), 8, '0', STR_PAD_RIGHT ) ) );
			// Append the last byte to the netmask binary string.
			$netmask_bin .= $last_byte;
		}

		// Pad the netmask binary string to 16 bytes (128 bits) with zeros (\x00).
		$netmask_bin = str_pad( $netmask_bin, 16, "\x00" );

		/**
		 * Use bitwise AND to apply the subnet mask to both the IP address and the network address.
		 * - ($ip_bin & $netmask_bin) isolates the network portion of the IP address.
		 * - ($range_bin & $netmask_bin) isolates the network portion of the CIDR range.
		 * - If both network portions are equal, the IP address belongs to the same subnet and is within the CIDR range.
		 */
		return ( $ip_bin & $netmask_bin ) === ( $range_bin & $netmask_bin );
	}

	/**
	 * Validates the low and high IP addresses of a range.
	 *
	 * Now supports IPv6 addresses.
	 *
	 * @param string $range_low  Low IP address.
	 * @param string $range_high High IP address.
	 * @return bool True if the range is valid, false otherwise.
	 */
	public static function validate_ip_range( $range_low, $range_high ) {
		// Validate that both IP addresses are valid.
		if ( self::validate_ip_addresses( array( $range_low, $range_high ) ) === false ) {
			return false;
		}

		// Ensure both IPs are of the same version
		$range_low_ip_version  = self::get_ip_version( $range_low );
		$range_high_ip_version = self::get_ip_version( $range_high );

		if ( $range_low_ip_version !== $range_high_ip_version || ! $range_low_ip_version || ! $range_high_ip_version ) {
			return false; // Invalid or mixed IP versions.
		}

		// Convert IP addresses to their packed binary representation.
		$ip_low  = inet_pton( $range_low );
		$ip_high = inet_pton( $range_high );

		// Check if the conversion was successful.
		if ( false === $ip_low || false === $ip_high ) {
			return false;
		}

		// Compare the binary representations to ensure the low IP is not greater than the high IP.
		if ( strcmp( $ip_low, $ip_high ) > 0 ) {
			return false;
		}

		return true;
	}

	/**
	 * Checks that a given IP address is within a given range.
	 *
	 * Supports CIDR notation and hyphenated ranges for both IPv4 and IPv6.
	 *
	 * @param string      $ip        IP address.
	 * @param string      $range_low Range low or CIDR notation.
	 * @param null|string $range_high Optional. Range high. Not used if $range_low is CIDR notation.
	 * @return bool
	 */
	public static function ip_address_is_in_range( $ip, $range_low, $range_high = null ) {
		// Validate that all provided IP addresses are valid.
		if ( $range_high !== null && ! self::validate_ip_addresses( array( $ip, $range_low, $range_high ) ) ) {
			return false;
		} else {
			$range_low_parsed = self::parse_cidr( $range_low );
			if ( $range_low_parsed && ! self::validate_ip_addresses( array( $ip, $range_low_parsed[0] ) ) ) {
				return false;
			}
		}

		if ( strpos( $range_low, '/' ) !== false ) {
			// CIDR notation
			if ( $range_high !== null ) {
				// Invalid usage: CIDR notation with range high parameter
				return false;
			}
			return self::ip_in_cidr( $ip, $range_low );
		}

		// Hyphenated range
		if ( $range_high === null ) {
			return false; // Invalid parameters
		}

		$ip_num  = inet_pton( $ip );
		$ip_low  = inet_pton( $range_low );
		$ip_high = inet_pton( $range_high );
		if ( $ip_num && $ip_low && $ip_high && strcmp( $ip_num, $ip_low ) >= 0 && strcmp( $ip_num, $ip_high ) <= 0 ) {
			return true;
		}
		return false;
	}
}
