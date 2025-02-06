<?php
/**
 * Atomic_Record_Jetpack_Token_Errors file.
 *
 * @package wpcomsh
 */

/**
 * Logs Jetpack token errors as response headers.
 */
class Atomic_Record_Jetpack_Token_Errors {
	/**
	 * $error is a WP_Error (always) and contains a "signature_details" data property with this structure:
	 * The error_code has one of the following values:
	 * - malformed_token
	 * - malformed_user_id
	 * - unknown_token
	 * - could_not_sign
	 * - invalid_nonce
	 * - signature_mismatch
	 *
	 * @param WP_Error $error WP_Error instance.
	 */
	public static function signature_error_header( $error ) {
		if ( headers_sent() ) {
			return;
		}

		if ( ! isset( $_SERVER['ATOMIC_SITE_ID'] ) && ! defined( 'ATOMIC_SITE_ID' ) ) {
			return;
		}

		if ( ! self::is_jetpack_request() ) {
			return;
		}

		$error_data = $error->get_error_data();
		if ( ! isset( $error_data['signature_details'] ) ) {
			return;
		}
		header(
			sprintf(
				'X-Jetpack-Signature-Error: %s',
				$error->get_error_code()
			)
		);
		header(
			sprintf(
				'X-Jetpack-Signature-Error-Message: %s',
				$error->get_error_message()
			)
		);
		header(
			sprintf(
				'X-Jetpack-Signature-Error-Details: %s',
				base64_encode( wp_json_encode( $error_data['signature_details'] ) ) // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			)
		);
	}

	/**
	 * Checks the IP to see if it's a Jetpack request.
	 *
	 * Stolen from https://github.com/Automattic/vip-go-mu-plugins/pull/1301.
	 *
	 * @return bool
	 */
	public static function is_jetpack_request() {
		// Filter by env.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return false;
		}

		// Simple UA check to filter out most.
		if ( false === stripos( $_SERVER['HTTP_USER_AGENT'], 'wpcomsh' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			return false;
		}

		// If it has a valid-looking UA, check the remote IP.
		// From https://jetpack.com/support/hosting-faq/#jetpack-whitelist
		$jetpack_ips = array(
			'122.248.245.244',
			'54.217.201.243',
			'54.232.116.4',
			'192.0.80.0/20',
			'192.0.96.0/20',
			'192.0.112.0/20',
			'195.234.108.0/22',
		);

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		return self::check_ip( $_SERVER['REMOTE_ADDR'], $jetpack_ips ) || ( isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) && self::check_ip( $_SERVER['HTTP_X_FORWARDED_FOR'], $jetpack_ips ) );
	}

	/**
	 * Checks if an IPv4 or IPv6 address is contained in the list of given IPs or subnets.
	 *
	 * @param string       $request_ip IP to check.
	 * @param string|array $ips        List of IPs or subnets (can be a string if only a single one).
	 *
	 * @return bool Whether the IP is valid.
	 */
	public static function check_ip( $request_ip, $ips ) {
		if ( ! is_array( $ips ) ) {
			$ips = array( $ips );
		}

		foreach ( $ips as $ip ) {
			if ( self::check_ipv4( $request_ip, $ip ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Compares two IPv4 addresses.
	 * In case a subnet is given, it checks if it contains the request IP.
	 *
	 * @param string $request_ip IPv4 address to check.
	 * @param string $ip        IPv4 address or subnet in CIDR notation.
	 *
	 * @return bool Whether the request IP matches the IP, or whether the request IP is within the CIDR subnet.
	 */
	public static function check_ipv4( $request_ip, $ip ) {
		if ( ! filter_var( $request_ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			return false;
		}
		if ( false !== strpos( $ip, '/' ) ) {
			list( $address, $netmask ) = explode( '/', $ip, 2 );
			if ( $netmask === '0' ) {
				return filter_var( $address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 );
			}
			if ( $netmask < 0 || $netmask > 32 ) {
				return false;
			}
		} else {
			$address = $ip;
			$netmask = 32;
		}

		return 0 === substr_compare( sprintf( '%032b', ip2long( $request_ip ) ), sprintf( '%032b', ip2long( $address ) ), 0, $netmask );
	}
}
add_action( 'jetpack_verify_signature_error', array( 'Atomic_Record_Jetpack_Token_Errors', 'signature_error_header' ) );
