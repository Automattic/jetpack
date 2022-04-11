<?php
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
		$tier = Product::get_site_tier( 10 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$6.95', $tier['full_price'] );
	}
	/**
	 * Get tier for 120 records
	 */
	public function test_get_site_tier_120() {
		$tier = Product::get_site_tier( 120 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$13.90', $tier['full_price'] );
	}
	/**
	 * Get tier for 1000 records
	 */
	public function test_get_site_tier_1000() {
		$tier = Product::get_site_tier( 1000 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$13.90', $tier['full_price'] );
	}
	/**
	 * Get tier for 1001 records
	 */
	public function test_get_site_tier_1001() {
		$tier = Product::get_site_tier( 1001 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$34.75', $tier['full_price'] );
	}
	/**
	 * Get tier for 1000000 records
	 */
	public function test_get_site_tier_1000000() {
		$tier = Product::get_site_tier( 1000000 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$278', $tier['full_price'] );
	}
	/**
	 * Get tier for 1000010 records
	 */
	public function test_get_site_tier_1000010() {
		$tier = Product::get_site_tier( 1000010 );
		$this->assertEquals( 'AUD', $tier['currency_code'] );
		$this->assertEquals( 'A$556', $tier['discount_price'] );
	}
}
