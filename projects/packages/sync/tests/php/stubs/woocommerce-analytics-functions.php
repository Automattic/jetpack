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
