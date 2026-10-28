<?php
/**
 * Stubs the WooCommerce functions the package reads: a euro store, with its orders as
 * `$GLOBALS['woocommerce_stats_mock_orders']`, a map of id to status.
 *
 * Require it from inside a process-isolated test only, so the functions never leak
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

if ( ! function_exists( 'get_woocommerce_currency' ) ) {
	/**
	 * Stub of get_woocommerce_currency().
	 *
	 * @return string
	 */
	function get_woocommerce_currency() {
		return 'EUR';
	}
}

if ( ! function_exists( 'get_woocommerce_currency_symbol' ) ) {
	/**
	 * Stub of get_woocommerce_currency_symbol(), which returns an HTML entity like the real one.
	 *
	 * @param string $currency Currency code.
	 * @return string
	 */
	function get_woocommerce_currency_symbol( $currency = '' ) {
		return 'EUR' === $currency ? '&euro;' : '';
	}
}

if ( ! function_exists( 'wc_get_order_statuses' ) ) {
	/**
	 * Stub of wc_get_order_statuses().
	 *
	 * @return string[]
	 */
	function wc_get_order_statuses() {
		return array(
			'wc-pending'    => 'Pending payment',
			'wc-processing' => 'Processing',
			'wc-completed'  => 'Completed',
		);
	}
}

if ( ! function_exists( 'wc_get_orders' ) ) {
	/**
	 * Stub of wc_get_orders().
	 *
	 * @param array $args Query arguments.
	 * @return int[]
	 */
	function wc_get_orders( $args = array() ) {
		$orders = $GLOBALS['woocommerce_stats_mock_orders'] ?? array();
		if ( isset( $args['status'] ) ) {
			$orders = array_filter( $orders, static fn( $status ) => in_array( 'wc-' . $status, $args['status'], true ) );
		}
		$ids = array_keys( $orders );

		return array_slice( $ids, 0, $args['limit'] ?? count( $ids ) );
	}
}
