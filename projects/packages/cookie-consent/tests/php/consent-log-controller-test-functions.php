<?php
/**
 * Consent log controller test functions.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Test double for function_exists() calls made from this namespace.
 *
 * @param string $function_name Function name.
 * @return bool
 */
function function_exists( $function_name ) {
	if ( 'wp_privacy_anonymize_ip' === $function_name ) {
		return $GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_exists'] ?? true;
	}

	return \function_exists( $function_name );
}

/**
 * Test double for WordPress's wp_privacy_anonymize_ip().
 *
 * @param string $ip_address IP address.
 * @return string|null
 */
function wp_privacy_anonymize_ip( $ip_address ) {
	$GLOBALS['jetpack_cookie_consent_test_wp_privacy_anonymize_ip_calls'][] = $ip_address;

	return jetpack_cookie_consent_test_anonymize_ip( $ip_address );
}

/**
 * Match WordPress IP anonymization masks for tests.
 *
 * @param string $ip_address IP address.
 * @return string|null
 */
function jetpack_cookie_consent_test_anonymize_ip( $ip_address ) {
	if ( \filter_var( $ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
		$octets    = explode( '.', $ip_address );
		$octets[3] = '0';
		return implode( '.', $octets );
	}

	if ( \filter_var( $ip_address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
		$packed = inet_pton( $ip_address );
		if ( false === $packed ) {
			return null;
		}

		$bytes = unpack( 'C*', $packed );
		if ( false === $bytes ) {
			return null;
		}

		for ( $i = 9; $i <= 16; $i++ ) {
			$bytes[ $i ] = 0;
		}

		$truncated = inet_ntop( pack( 'C*', ...array_values( $bytes ) ) );
		return false === $truncated ? null : $truncated;
	}

	return null;
}
