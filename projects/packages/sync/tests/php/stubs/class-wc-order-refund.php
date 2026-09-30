<?php
/**
 * Plain WooCommerce refund stub, as loaded while WooCommerce Analytics is disabled.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/class-wc-abstract-order.php';

if ( ! class_exists( 'WC_Order_Refund', false ) ) {
	/**
	 * WooCommerce refund stub.
	 */
	class WC_Order_Refund extends WC_Abstract_Order {}
}
