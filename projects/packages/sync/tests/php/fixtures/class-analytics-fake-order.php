<?php
/**
 * Configurable WooCommerce Analytics order stub.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/../stubs/class-wc-order.php';
require_once __DIR__ . '/trait-analytics-fake-order-props.php';

if ( ! class_exists( 'Analytics_Fake_Order', false ) ) {
	/**
	 * Configurable order.
	 */
	class Analytics_Fake_Order extends WC_Order {
		use Analytics_Fake_Order_Props;

		/**
		 * Get the order type.
		 *
		 * @return string
		 */
		public function get_type() {
			return 'shop_order';
		}
	}
}
