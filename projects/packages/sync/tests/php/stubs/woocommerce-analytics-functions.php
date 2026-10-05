<?php
/**
 * WooCommerce function stubs for Analytics helper tests.
 *
 * @package automattic/jetpack-sync
 */

if ( ! function_exists( 'wc_get_order_statuses' ) ) {
	/**
	 * Return representative registered WooCommerce statuses.
	 *
	 * @return string[]
	 */
	function wc_get_order_statuses() {
		return array(
			'wc-pending' => 'Pending',
			'wc-custom'  => 'Custom',
		);
	}
}

if ( ! function_exists( 'wc_get_order' ) ) {
	/**
	 * Return a test order registered in $jetpack_sync_test_orders, or false when absent.
	 *
	 * Defaulting to false mirrors WooCommerce's behavior for a deleted or unloadable order.
	 *
	 * @param int $order_id Order ID.
	 * @return object|false
	 */
	function wc_get_order( $order_id = 0 ) {
		global $jetpack_sync_test_orders;

		if ( is_array( $jetpack_sync_test_orders ) && isset( $jetpack_sync_test_orders[ $order_id ] ) ) {
			return $jetpack_sync_test_orders[ $order_id ];
		}

		return false;
	}
}

if ( ! function_exists( 'wc_timezone_offset' ) ) {
	/**
	 * Return a half-hour site offset.
	 *
	 * @return int
	 */
	function wc_timezone_offset() {
		return 19800;
	}
}

if ( ! function_exists( 'wc_format_decimal' ) ) {
	/**
	 * Format a number as WooCommerce does for a float with no decimal places given.
	 *
	 * @param mixed $number Number.
	 * @return string
	 */
	function wc_format_decimal( $number ) {
		return rtrim( rtrim( sprintf( '%.6f', (float) $number ), '0' ), '.' );
	}
}

if ( ! function_exists( 'wc_string_to_datetime' ) ) {
	/**
	 * Read a date string in the site timezone, a named zone with DST unlike the fixed wc_timezone_offset() above.
	 *
	 * @param string $time_string Date string.
	 * @return WC_DateTime
	 */
	function wc_string_to_datetime( $time_string ) {
		return new WC_DateTime( $time_string, new DateTimeZone( 'Europe/Amsterdam' ) );
	}
}
