<?php
/**
 * Plain WooCommerce order stub, as loaded while WooCommerce Analytics is disabled.
 *
 * @package automattic/jetpack-sync
 */

require_once __DIR__ . '/class-wc-abstract-order.php';

if ( ! class_exists( 'WC_Order', false ) ) {
	/**
	 * WooCommerce order stub.
	 */
	class WC_Order extends WC_Abstract_Order {}
}
