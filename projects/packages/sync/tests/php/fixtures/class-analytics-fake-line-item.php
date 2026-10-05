<?php
/**
 * Line item stub with a quantity.
 *
 * @package automattic/jetpack-sync
 */

if ( ! class_exists( 'Analytics_Fake_Line_Item', false ) ) {
	/**
	 * Line item stub.
	 */
	class Analytics_Fake_Line_Item {
		/**
		 * Quantity.
		 *
		 * @var int
		 */
		private $quantity;

		/**
		 * Constructor.
		 *
		 * @param int $quantity Quantity.
		 */
		public function __construct( $quantity ) {
			$this->quantity = $quantity;
		}

		/**
		 * Get the quantity.
		 *
		 * @return int
		 */
		public function get_quantity() {
			return $this->quantity;
		}
	}
}
