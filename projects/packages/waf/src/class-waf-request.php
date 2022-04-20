<?php
/**
 * HTTP request representation specific for the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

require_once __DIR__ . '/functions.php';

/**
 * Request representation.
 */
class Waf_Request {

	/**
	 * Trusted proxies.
	 *
	 * @var array List of trusted proxy IP addresses.
	 */
	private $trusted_proxies = array();

	/**
	 * Trusted headers.
	 *
	 * @var array List of headers to trust from the trusted proxies.
	 */
	private $trusted_headers = array();

	/**
	 * Sets the list of IP addresses for the proxies to trust. Trusted headers will only be accepted as the
	 * user IP address from these IP adresses.
	 *
	 * Popular choices include:
	 * - 192.168.0.1
	 * - 10.0.0.1
	 *
	 * @param array $proxies List of proxy IP addresses.
	 * @return void
	 */
	public function set_trusted_proxies( $proxies ) {
		$this->trusted_proxies = (array) $proxies;
	}

	/**
	 * Sets the list of headers to be trusted from the proxies. These headers will only be taken into account
	 * if the request comes from a trusted proxy as configured with set_trusted_proxies().
	 *
	 * Popular choices include:
	 * - HTTP_CLIENT_IP
	 * - HTTP_X_FORWARDED_FOR
	 * - HTTP_X_FORWARDED
	 * - HTTP_X_CLUSTER_CLIENT_IP
	 * - HTTP_FORWARDED_FOR
	 * - HTTP_FORWARDED
	 *
	 * @param array $headers List of HTTP header strings.
	 * @return void
	 */
	public function set_trusted_headers( $headers ) {
		$this->trusted_headers = (array) $headers;
	}

	/**
	 * Determines the users real IP address based on the settings passed to set_trusted_proxies() and
	 * set_trusted_headers() before. On CLI, this will be null.
	 *
	 * @return string|null
	 */
	public function get_real_user_ip_address() {
		$remote_addr = ! empty( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( in_array( $remote_addr, $this->trusted_proxies, true ) ) {
			$ip_by_header = $this->get_ip_by_header( array_merge( $this->trusted_headers, array( 'REMOTE_ADDR' ) ) );
			if ( ! empty( $ip_by_header ) ) {
				return $ip_by_header;
			}
		}

		return $remote_addr;
	}

	/**
	 * Iterates through a given list of HTTP headers and attempts to get the IP address from the header that
	 * a proxy sends along. Make sure you trust the IP address before calling this method.
	 *
	 * @param array $headers The list of headers to check.
	 * @return string|null
	 */
	private function get_ip_by_header( $headers ) {
		foreach ( $headers as $key ) {
			if ( isset( $_SERVER[ $key ] ) ) {
				foreach ( explode( ',', wp_unslash( $_SERVER[ $key ] ) ) as $ip ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- filter_var is applied below.
					$ip = trim( $ip );

					if ( filter_var( $ip, FILTER_VALIDATE_IP ) !== false ) {
						return $ip;
					}
				}
			}
		}

		return null;
	}
}
