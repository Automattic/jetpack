<?php
/**
 * WooCommerce OrdersScheduler stub exposing the test order check.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Internal\Admin\Schedulers;

if ( ! class_exists( OrdersScheduler::class, false ) ) {
	/**
	 * OrdersScheduler stub.
	 */
	class OrdersScheduler {
		/**
		 * Treat orders flagged `is_test` as test orders.
		 *
		 * @param object $order The order.
		 * @return bool
		 */
		public static function is_test_order( $order ) {
			return ! empty( $order->fields['is_test'] );
		}
	}
}
