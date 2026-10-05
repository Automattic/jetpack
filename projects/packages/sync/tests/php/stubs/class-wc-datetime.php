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

		/**
		 * Format the date in its own timezone, as WooCommerce's date() does.
		 *
		 * @param string $format Date format.
		 * @return string
		 */
		public function date( $format ) {
			return $this->format( $format );
		}
	}
}
