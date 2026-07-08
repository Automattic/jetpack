<?php
/**
 * Mock WC_Product class for testing.
 *
 * This mock is loaded by bootstrap.php before the test environment
 * to allow testing of add_prices_in_posts functionality.
 *
 * @package automattic/jetpack-blaze
 */

if ( ! class_exists( 'WC_Product' ) ) {
	/**
	 * Mock WC_Product class for testing.
	 *
	 * This class provides a minimal WC_Product implementation when WooCommerce is not installed.
	 * It is excluded from Phan analysis to avoid conflicts with woocommerce stubs.
	 */
	class WC_Product {
		/**
		 * Product price.
		 *
		 * @var string
		 */
		private $price;

		/**
		 * Constructor.
		 *
		 * @param string $price The product price.
		 */
		public function __construct( $price = '' ) {
			$this->price = $price;
		}

		/**
		 * Get the product price.
		 *
		 * @param string $context What the value is for. Valid values are view and edit.
		 * @return string The product price.
		 */
		public function get_price( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->price;
		}
	}
}
