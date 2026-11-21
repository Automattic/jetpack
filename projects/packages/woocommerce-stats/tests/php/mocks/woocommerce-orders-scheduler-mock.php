<?php
/**
 * Stubs core's order import scheduler: `$GLOBALS['woocommerce_stats_mock_import_exclusions']` maps an
 * order id to what `is_excluded_from_import()` answers, and `$GLOBALS['woocommerce_stats_mock_test_orders']`
 * lists test-mode orders. Orders come from `wc-get-order-mock.php`.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

namespace Automattic\WooCommerce\Internal\Admin\Schedulers;

require_once __DIR__ . '/wc-get-order-mock.php';

if ( ! class_exists( OrdersScheduler::class ) ) {
	/**
	 * Stub of OrdersScheduler.
	 */
	class OrdersScheduler {
		/**
		 * Stub of is_excluded_from_import().
		 *
		 * @param int $order_id Order id.
		 * @return bool|null
		 */
		public static function is_excluded_from_import( int $order_id ): ?bool {
			$exclusions = $GLOBALS['woocommerce_stats_mock_import_exclusions'] ?? array();

			return array_key_exists( $order_id, $exclusions ) ? $exclusions[ $order_id ] : false;
		}

		/**
		 * Stub of is_test_order().
		 *
		 * @param object $order Order.
		 * @return bool
		 */
		public static function is_test_order( $order ) {
			return in_array( $order->id, $GLOBALS['woocommerce_stats_mock_test_orders'] ?? array(), true );
		}
	}
}
