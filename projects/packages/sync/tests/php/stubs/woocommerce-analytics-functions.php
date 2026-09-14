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
