<?php
/**
 * Status and information regarding the site visitor.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\IP\Utils as IP_Utils;

/**
 * Visitor class.
 */
class Visitor {

	/**
	 * Gets current user IP address.
	 *
	 * Only a value that parses as an IP address is returned. With `$check_all_headers`, the
	 * forwarded headers are tried in order, a comma-separated list yields its first valid entry,
	 * and a header holding no valid address is skipped.
	 *
	 * A site with a trusted header configured is a special case: that header, and how far back
	 * to count in it, was worked out for this site's own proxy setup, so it is consulted before
	 * the list below rather than guessed at. See `get_trusted_header_ip()`.
	 *
	 * The address is normalized by `IP\Utils::clean_ip()`: it is lowercased, anything following an
	 * " unless " separator is dropped, and a port suffix, IPv6 brackets, or an `::ffff:` IPv4
	 * mapping are reduced to the bare address. Code comparing this value against a stored or
	 * configured address should normalize that address the same way.
	 *
	 * @param  bool $check_all_headers Check all headers? Default is `false`.
	 *
	 * @return string Current user IP address, or an empty string if no valid address could be determined.
	 */
	public function get_ip( $check_all_headers = false ) {
		if ( $check_all_headers ) {
			$trusted_ip = $this->get_trusted_header_ip();
			if ( false !== $trusted_ip ) {
				return $trusted_ip;
			}

			foreach ( array(
				'HTTP_CF_CONNECTING_IP',
				'HTTP_CLIENT_IP',
				'HTTP_X_FORWARDED_FOR',
				'HTTP_X_FORWARDED',
				'HTTP_X_CLUSTER_CLIENT_IP',
				'HTTP_FORWARDED_FOR',
				'HTTP_FORWARDED',
				'HTTP_VIA',
			) as $key ) {
				if ( empty( $_SERVER[ $key ] ) ) {
					continue;
				}
				// Proxies append to the list, so the leftmost entry is the client.
				foreach ( explode( ',', (string) wp_unslash( $_SERVER[ $key ] ) ) as $candidate ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Each entry is validated by clean_ip() below.
					$ip = IP_Utils::clean_ip( $candidate );
					if ( false !== $ip ) {
						return $ip;
					}
				}
			}
		}

		$ip = empty( $_SERVER['REMOTE_ADDR'] ) ? false : IP_Utils::clean_ip( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- clean_ip() validates it.
		return false !== $ip ? $ip : '';
	}

	/**
	 * Resolves the visitor address from the header that was verified for this site.
	 *
	 * Brute force protection stores the header to read, how many entries back from the end of
	 * its list the visitor sits, and whether that list runs in reverse, in the
	 * `trusted_ip_header` site option. That is an answer for this site's actual proxy setup,
	 * which is more than the header sweep in `get_ip()` can work out on its own, so it wins
	 * when it is available.
	 *
	 * `IP\Utils::get_ip()` owns reading it, so the two stay in step rather than each deciding
	 * which entry of a forwarded list belongs to the visitor.
	 *
	 * @return string|false Visitor IP address, or false when the site has no trusted header,
	 *                      the request did not carry it, or it held no valid address.
	 */
	private function get_trusted_header_ip() {
		$trusted_header_data = get_site_option( 'trusted_ip_header' );

		if ( ! isset( $trusted_header_data->trusted_header ) || ! isset( $_SERVER[ $trusted_header_data->trusted_header ] ) ) {
			return false;
		}

		return IP_Utils::get_ip();
	}

	/**
	 * Simple gate check for a11n feature testing purposes using AT_PROXIED_REQUEST constant.
	 * IMPORTANT: Only use it for internal feature test purposes, not authorization.
	 *
	 * The goal of this function is to help us gate features by using a similar function name
	 * we find on simple sites: is_automattician().
	 *
	 * @return bool True if the current request is PROXIED, false otherwise.
	 */
	public function is_automattician_feature_flags_only() {
		return ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST );
	}

	/**
	 * Whether the current request should be attributed to an Automattician in analytics.
	 *
	 * True for an identified Automattician on WordPress.com Simple, and for A8C-proxied
	 * requests on both Simple and WoA. Use it to tag Tracks events as internal traffic so
	 * it can be filtered out of product reporting — this matters most for newly launched
	 * features, where a small amount of internal testing is a large share of the totals
	 * and there is no way to separate it after the fact.
	 *
	 * IMPORTANT: Reporting signal only, never authorization. A proxied request says
	 * something about where the request came from, not who the user is.
	 *
	 * @since 6.4.0
	 *
	 * @return bool True if the request looks like Automattician traffic, false otherwise.
	 */
	public function is_tracking_automattician() {
		// Identified Automattician on WordPress.com Simple.
		if ( function_exists( 'is_automattician' ) && \is_automattician() ) {
			return true;
		}

		// Proxied A8C request on WordPress.com Simple.
		if ( function_exists( 'wpcom_is_proxied_request' ) && \wpcom_is_proxied_request() ) {
			return true;
		}

		// Proxied A8C request on WoA.
		return $this->is_automattician_feature_flags_only();
	}
}
