<?php
/**
 * WooCommerce order factory stub.
 *
 * @package automattic/jetpack-sync
 */

if ( ! class_exists( 'WC_Order_Factory', false ) ) {
	/**
	 * Load order items registered in $jetpack_sync_test_order_items.
	 */
	class WC_Order_Factory {
		/**
		 * Get an order item, or false when absent.
		 *
		 * @param int $item_id Order item ID.
		 * @return object|false
		 */
		public static function get_order_item( $item_id ) {
			global $jetpack_sync_test_order_items;

			return $jetpack_sync_test_order_items[ $item_id ] ?? false;
		}
	}
}
