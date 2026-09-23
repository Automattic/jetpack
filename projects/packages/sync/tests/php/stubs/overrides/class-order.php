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
		 * Get the report customer ID.
		 *
		 * @return int
		 */
		public function get_report_customer_id() {
			return 7;
		}
	}
}
