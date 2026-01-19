<?php
/**
 * Mock WC_Product class for testing.
 *
 * This mock is loaded by bootstrap.php before the test environment
 * to allow testing of add_prices_in_posts functionality.
 *
 * @package automattic/jetpack-blaze
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

if ( ! class_exists( 'WC_Product' ) ) {
	/**
	 * Mock WC_Product class for testing.
	 *
	 * This class mimics the WC_Product class interface used by add_prices_in_posts.
	 */
	class WC_Product {
		/**
		 * Product price.
		 *
		 * @var string
		 */
		protected $price = '';

		/**
		 * Get the product price.
		 *
		 * @return string The product price.
		 */
		public function get_price() {
			return $this->price;
		}
	}
}

/**
 * Mock WC_Product class for testing with a specific price.
 *
 * This class extends WC_Product and allows setting a custom price.
 */
class Mock_WC_Product extends WC_Product {
	/**
	 * Product price.
	 *
	 * @var string
	 */
	private $mock_price;

	/**
	 * Constructor.
	 *
	 * @param string $price The product price.
	 */
	public function __construct( $price ) {
		$this->mock_price = $price;
	}

	/**
	 * Get the product price.
	 *
	 * @return string The product price.
	 */
	public function get_price() {
		return $this->mock_price;
	}
}
