<?php
/**
 * Stubs WooCommerce's order query with the ids in `$GLOBALS['jetpack_woocommerce_stats_order_ids']`.
 *
 * Require it from inside a process-isolated test only, so the function never leaks
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

if ( ! function_exists( 'wc_get_orders' ) ) {
	/**
	 * Stub of wc_get_orders().
	 *
	 * @param array $args Query arguments.
	 * @return int[]
	 */
	function wc_get_orders( $args = array() ) {
		return array_slice( $GLOBALS['jetpack_woocommerce_stats_order_ids'] ?? array(), 0, $args['limit'] ?? null );
	}
}
