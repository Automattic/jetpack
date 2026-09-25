<?php
/**
 * WooCommerce abstract order stub, without the report methods WooCommerce Analytics adds.
 *
 * @package automattic/jetpack-sync
 */

if ( ! class_exists( 'WC_Abstract_Order', false ) ) {
	/**
	 * WooCommerce abstract order stub.
	 */
	abstract class WC_Abstract_Order {
		/**
		 * Get the order ID.
		 *
		 * @return int
		 */
		public function get_id() {
			return 123;
		}
	}
}
