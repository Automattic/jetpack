<?php
/**
 * Status and information regarding the site visitor.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

/**
 * Visitor class.
 */
class Visitor {

	/**
	 * Gets current user IP address.
	 *
	 * @param  bool $check_all_headers Check all headers? Default is `false`.
	 *
	 * @return string                  Current user IP address.
	 */
	public function get_ip( $check_all_headers = false ) {
		if ( $check_all_headers ) {
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
				if ( ! empty( $_SERVER[ $key ] ) ) {
					// @todo Some of these might actually be lists of IPs (e.g. HTTP_X_FORWARDED_FOR) or something else entirely (HTTP_VIA).
					return filter_var( wp_unslash( $_SERVER[ $key ] ) );
				}
			}
		}

		return ! empty( $_SERVER['REMOTE_ADDR'] ) ? filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
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
