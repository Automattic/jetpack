<?php
/**
 * The Status package's Visitor class as it looked before is_tracking_automattician()
 * was added, for tests that need method_exists() on it to be false. Deliberately not
 * wrapped in class_exists(): a fatal is a clearer failure than a silent no-op, and
 * callers check first. Only safe to load in a process-isolated test.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Status;

/**
 * Visitor as jetpack-status shipped it before 6.4.0.
 */
class Visitor {

	/**
	 * Gets current user IP address.
	 *
	 * @param bool $check_all_headers Check all headers? Default is `false`.
	 *
	 * @return string Current user IP address.
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
					return filter_var( wp_unslash( $_SERVER[ $key ] ) );
				}
			}
		}

		return ! empty( $_SERVER['REMOTE_ADDR'] ) ? filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	}

	/**
	 * Simple gate check for a11n feature testing purposes.
	 *
	 * @return bool True if the current request is proxied, false otherwise.
	 */
	public function is_automattician_feature_flags_only() {
		return ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST );
	}
}
