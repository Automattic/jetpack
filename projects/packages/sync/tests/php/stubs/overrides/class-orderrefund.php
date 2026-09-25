<?php
/**
 * WooCommerce Analytics refund stub, which adds the report methods to a plain refund.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Admin\Overrides;

require_once __DIR__ . '/../class-wc-order-refund.php';

if ( ! class_exists( OrderRefund::class, false ) ) {
	/**
	 * WooCommerce Analytics refund stub.
	 */
	class OrderRefund extends \WC_Order_Refund {
		/**
		 * Swap WC_Order_Refund for this class, as WooCommerce's filter does.
		 *
		 * @param string $classname  Order class name.
		 * @param string $order_type Order type.
		 * @param int    $order_id   Order ID.
		 * @return string
		 */
		public static function order_class_name( $classname, $order_type, $order_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return 'WC_Order_Refund' === $classname ? self::class : $classname;
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
