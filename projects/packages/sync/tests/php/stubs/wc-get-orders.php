<?php
/**
 * WooCommerce wc_get_orders() stub, kept apart so only the tests that load it define it.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/class-wc-order.php';

if ( ! function_exists( 'wc_get_orders' ) ) {
	/**
	 * Load each order in post__in through the woocommerce_order_class filter, as WC_Order_Factory does.
	 *
	 * @param array $args Query arguments.
	 * @return WC_Abstract_Order[]
	 */
	function wc_get_orders( $args ) {
		$orders = array();
		foreach ( $args['post__in'] as $order_id ) {
			$class_name = apply_filters( 'woocommerce_order_class', 'WC_Order', 'shop_order', $order_id );
			$orders[]   = new $class_name();
		}

		return $orders;
	}
}
