<?php
/**
 * WooCommerce datetime stub.
 *
 * @package automattic/jetpack-sync
 */

if ( ! class_exists( 'WC_DateTime', false ) ) {
	/**
	 * WooCommerce datetime stand-in.
	 */
	class WC_DateTime extends DateTime {
		/**
		 * Match WooCommerce's protected offset property.
		 *
		 * @var int
		 */
		protected $utc_offset = 0;
	}
}
