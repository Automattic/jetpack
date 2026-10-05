<?php
/**
 * WooCommerce OrderUtil stub; tests set $GLOBALS['jetpack_sync_test_old_full_refund_data'] for the old format.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Utilities;

if ( ! class_exists( OrderUtil::class, false ) ) {
	/**
	 * WooCommerce OrderUtil stub.
	 */
	class OrderUtil {
		/**
		 * Whether full refunds use the new data format, unless a test turns it off.
		 *
		 * @return bool
		 */
		public static function uses_new_full_refund_data() {
			return empty( $GLOBALS['jetpack_sync_test_old_full_refund_data'] );
		}
	}
}
