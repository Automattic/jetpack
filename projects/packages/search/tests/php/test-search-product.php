<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class `Product`
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\Test_Case as Search_Test_Case;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_Search_Product extends Search_Test_Case {
	/**
	 * Test get all products
	 */
	public function test_get_products() {
		$products = Product::get_products();
		$this->assertNotEmpty( $products );
		$this->assertArrayHasKey( 'jetpack_search', $products );
	}

	/**
	 * Get only search products
	 */
	public function test_get_promoted_product() {
		$product = Product::get_promoted_product();
		$this->assertNotEmpty( $product );
		$this->assertEquals( $product['product_id'], 2104 );
	}

	/**
	 * Get tier for 10 records
	 */
	public function test_get_site_tier_10() {
		$tier = Product::get_site_tier_pricing( 10 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 83.4, $tier['full_price'] );
		$this->assertPriceEqual( 41.7, $tier['discount_price'] );
	}

	/**
	 * Get tier for 120 records
	 */
	public function test_get_site_tier_120() {
		$tier = Product::get_site_tier_pricing( 120 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 166.8, $tier['full_price'] );
		$this->assertPriceEqual( 83.4, $tier['discount_price'] );
	}

	/**
	 * Get tier for 1000 records
	 */
	public function test_get_site_tier_1000() {
		$tier = Product::get_site_tier_pricing( 1000 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 166.8, $tier['full_price'] );
		$this->assertPriceEqual( 83.4, $tier['discount_price'] );
	}

	/**
	 * Get tier for 1001 records
	 */
	public function test_get_site_tier_1001() {
		$tier = Product::get_site_tier_pricing( 1001 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 417, $tier['full_price'] );
		$this->assertPriceEqual( 208.5, $tier['discount_price'] );
	}

	/**
	 * Get tier for 1000000 records
	 */
	public function test_get_site_tier_1000000() {
		$tier = Product::get_site_tier_pricing( 1000000 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 3336, $tier['full_price'] );
		$this->assertPriceEqual( 1668, $tier['discount_price'] );
	}

	/**
	 * Get tier for 1000010 records
	 */
	public function test_get_site_tier_1000010() {
		$tier = Product::get_site_tier_pricing( 1000010 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertPriceEqual( 6672, $tier['full_price'] );
		$this->assertPriceEqual( 3336, $tier['discount_price'] );
	}

	/**
	 * Price equals with delta 0.0001
	 *
	 * @param float $expected Expected float number.
	 * @param float $actual   The actual float number.
	 */
	public function assertPriceEqual( $expected, $actual ) {
		return $this->assertEqualsWithDelta( $expected, $actual, 0.0001 );
	}
}
