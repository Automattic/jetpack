<?php
/**
 * Product visibility filter tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/class-sample-pinned-product.php';

/**
 * Unit tests for the Product_Visibility class.
 */
class Product_Visibility_Test extends TestCase {

	/**
	 * States the host filter should apply, keyed by product slug.
	 *
	 * @var array
	 */
	private $host_states = array();

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'jetpack_my_jetpack_product_visibility', array( $this, 'apply_host_states' ) );
		add_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
	}

	/**
	 * Swaps the Stats product for one that records deactivation attempts.
	 *
	 * @param array $classes The registered product classes.
	 * @return array
	 */
	public function replace_stats_product( $classes ) {
		$classes['stats'] = Sample_Pinned_Product::class;

		return $classes;
	}

	/**
	 * Returning the environment to its previous state.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_my_jetpack_product_visibility', array( $this, 'apply_host_states' ) );
		remove_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
		Sample_Pinned_Product::$deactivated = false;
		$this->host_states                  = array();

		parent::tearDown();
	}

	/**
	 * Stands in for a host's mu-plugin.
	 *
	 * @param array $states The state map.
	 * @return array
	 */
	public function apply_host_states( $states ) {
		return array_merge( $states, $this->host_states );
	}

	/**
	 * A product no host has an opinion about is listed.
	 */
	public function test_product_with_no_host_opinion_is_listed() {
		$this->assertTrue( Product_Visibility::is_listed( 'stats' ) );
	}

	/**
	 * A host can keep a product off the Products page.
	 */
	public function test_host_can_hide_a_product() {
		$this->host_states = array( 'stats' => Admin_Menu::VISIBILITY_HIDDEN );

		$this->assertFalse( Product_Visibility::is_listed( 'stats' ) );
	}

	/**
	 * A host can take away the site owner's control of a product's activation.
	 */
	public function test_host_can_pin_a_product() {
		$this->host_states = array( 'stats' => Product_Visibility::STATE_PINNED );

		$this->assertTrue( Product_Visibility::is_pinned( 'stats' ) );
	}

	/**
	 * A host returning something that isn't a map leaves every product listed.
	 */
	public function test_malformed_filter_return_leaves_products_listed() {
		add_filter( 'jetpack_my_jetpack_product_visibility', '__return_false', 20 );

		$listed = Product_Visibility::is_listed( 'stats' );

		remove_filter( 'jetpack_my_jetpack_product_visibility', '__return_false', 20 );

		$this->assertTrue( $listed );
	}

	/**
	 * The state map stays a map whatever a host returns from the filter.
	 */
	public function test_get_states_returns_a_map_when_a_host_returns_something_else() {
		add_filter( 'jetpack_my_jetpack_product_visibility', '__return_false', 20 );

		$states = Product_Visibility::get_states();

		remove_filter( 'jetpack_my_jetpack_product_visibility', '__return_false', 20 );

		$this->assertIsArray( $states );
	}

	/**
	 * A pinned product refuses deactivation over REST instead of accepting and reverting.
	 */
	public function test_pinned_product_refuses_rest_deactivation() {
		$this->host_states = array( 'stats' => Product_Visibility::STATE_PINNED );

		$request = new \WP_REST_Request( 'POST', '/my-jetpack/v1/site/products/deactivate' );
		$request->set_param( 'products', array( 'stats' ) );

		$response = REST_Products::deactivate_products( $request );

		$this->assertTrue( is_wp_error( $response ) );
		$this->assertSame( 'product_pinned', $response->get_error_code() );
		$this->assertFalse( Sample_Pinned_Product::$deactivated );
	}

	/**
	 * A product no host pinned still deactivates.
	 */
	public function test_unpinned_product_still_deactivates_over_rest() {
		$request = new \WP_REST_Request( 'POST', '/my-jetpack/v1/site/products/deactivate' );
		$request->set_param( 'products', array( 'stats' ) );

		REST_Products::deactivate_products( $request );

		$this->assertTrue( Sample_Pinned_Product::$deactivated );
	}
}
