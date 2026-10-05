<?php
/**
 * WooCommerce 11.0+ FulfillmentUtils stub where every order is fulfilled.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Admin\Features\Fulfillments;

if ( ! class_exists( FulfillmentUtils::class, false ) ) {
	/**
	 * WooCommerce FulfillmentUtils stub.
	 */
	class FulfillmentUtils {
		/**
		 * Get an order's fulfillment status.
		 *
		 * @param \WC_Order $order Order.
		 * @return string
		 */
		public static function get_order_fulfillment_status( $order ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return 'fulfilled';
		}
	}
}
