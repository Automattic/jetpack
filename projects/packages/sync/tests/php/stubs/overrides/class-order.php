<?php
/**
 * WooCommerce Analytics order stub, which adds the report methods to a plain order.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Admin\Overrides;

require_once __DIR__ . '/../class-wc-order.php';

if ( ! class_exists( Order::class, false ) ) {
	/**
	 * WooCommerce Analytics order stub.
	 */
	class Order extends \WC_Order {
		/**
		 * Swap WC_Order for this class, as WooCommerce's filter does.
		 *
		 * @param string $classname  Order class name.
		 * @param string $order_type Order type.
		 * @param int    $order_id   Order ID.
		 * @return string
		 */
		public static function order_class_name( $classname, $order_type, $order_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return 'WC_Order' === $classname ? self::class : $classname;
		}

		/**
		 * Get the report customer ID.
		 *
		 * @return int
		 */
		public function get_report_customer_id() {
			return 7;
		}
	}
}
