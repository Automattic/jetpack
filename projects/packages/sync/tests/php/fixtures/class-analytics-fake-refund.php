<?php
/**
 * Configurable WooCommerce Analytics refund stub.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/../stubs/class-wc-order-refund.php';
require_once __DIR__ . '/trait-analytics-fake-order-props.php';

if ( ! class_exists( 'Analytics_Fake_Refund', false ) ) {
	/**
	 * Configurable refund.
	 */
	class Analytics_Fake_Refund extends WC_Order_Refund {
		use Analytics_Fake_Order_Props;

		/**
		 * Get the order type.
		 *
		 * @return string
		 */
		public function get_type() {
			return 'shop_order_refund';
		}
	}
}
