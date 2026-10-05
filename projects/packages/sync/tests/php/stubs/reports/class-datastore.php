<?php
/**
 * WooCommerce order stats data store stub whose table has the fulfillment_status column.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Admin\API\Reports\Orders\Stats;

if ( ! class_exists( DataStore::class, false ) ) {
	/**
	 * WooCommerce order stats data store stub.
	 */
	class DataStore {
		/**
		 * Whether wc_order_stats has the fulfillment_status column.
		 *
		 * @return bool
		 */
		public static function has_fulfillment_status_column() {
			return true;
		}
	}
}
