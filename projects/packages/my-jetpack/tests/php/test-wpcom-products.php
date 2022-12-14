<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Test_Wpcom_Products extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {

		// See https://stackoverflow.com/a/41611876.
		if ( version_compare( phpversion(), '5.7', '<=' ) ) {
			$this->markTestSkipped( 'avoid bug in PHP 5.6 that throws strict mode warnings for abstract static methods.' );
		}

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Initializer::init();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

	}

	/**
	 * Creates a mock user and logs in
	 */
	public function create_user_and_login() {
		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Mocks a successful response from WPCOM
	 */
	public function mock_success_response() {
		return array(
			'body'     => wp_json_encode( $this->get_mock_products_data() ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Mocks a failed response from WPCOM
	 */
	public function mock_error_response() {
		return array(
			'body'     => '',
			'response' => array(
				'code'    => 500,
				'message' => '',
			),
		);
	}

	/**
	 * Mocks a successful products object
	 */
	public function get_mock_products_data() {
		return (object) array(
			'jetpack_backup_one_time'    => (object) array(
				'product_id'             => 1111,
				'product_name'           => 'Jetpack Backup (One-time)',
				'product_slug'           => 'jetpack_backup_one_time',
				'description'            => '',
				'product_type'           => 'jetpack',
				'available'              => true,
				'is_domain_registration' => false,
				'cost_display'           => 'R$4.90',
				'cost'                   => 4.9,
				'currency_code'          => 'BRL',
			),
			'jetpack_videopress_monthly' => (object) array(
				'product_id'             => 2222,
				'product_name'           => 'Jetpack Backup (One-time)',
				'product_slug'           => 'jetpack_backup_one_time',
				'description'            => '',
				'product_type'           => 'jetpack',
				'available'              => true,
				'is_domain_registration' => false,
				'cost_display'           => 'R$4.90',
				'cost'                   => 4.9,
				'currency_code'          => 'BRL',
				'sale_coupon'            => (object) array(
					'start_date' => gmdate( 'Y' ) . '-01-01',
					'expires'    => gmdate( 'Y' ) . '-12-31',
					'discount'   => 50,
				),
			),
		);
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();

	}

	/**
	 * Test get products without user
	 */
	public function test_get_products_without_user() {
		wp_set_current_user( 0 );
		$this->assertEmpty( Wpcom_Products::get_products() );
	}

	/**
	 * Test get products
	 */
	public function test_get_products() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$this->assertEquals( $this->get_mock_products_data(), $products );
		$this->assertEquals( Wpcom_Products::get_product( 'jetpack_videopress_monthly' ), $products->jetpack_videopress_monthly );

		// test cache.
		$this->assertEquals( $this->get_mock_products_data(), get_user_meta( get_current_user_id(), Wpcom_Products::CACHE_META_NAME, true ) );

		// tests that a second request will get from cache. If it tried to make the request, it would throw a Fatal error.
		$products = Wpcom_Products::get_products();
		$this->assertEquals( $this->get_mock_products_data(), $products );

	}

	/**
	 * Test get products with error
	 */
	public function test_get_products_error() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );

		$this->assertTrue( is_wp_error( $products ) );

	}

	/**
	 * Test that we get data from cache if a request fails
	 */
	public function test_get_products_cache_if_error() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$this->assertFalse( is_wp_error( $products ) );

		add_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );

		$this->assertEquals( $this->get_mock_products_data(), $products );

	}

	/**
	 * Test get product price
	 */
	public function test_get_product_price() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$product_price = Wpcom_Products::get_product_pricing( 'jetpack_videopress_monthly' );
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$expected = array(
			'currency_code'         => 'BRL',
			'full_price'            => 4.9,
			'discount_price'        => 2.45,
			'is_introductory_offer' => false,
			'coupon_discount'       => 50,
		);

		$this->assertSame( $expected, $product_price );

	}

	/**
	 * Test get product price invalid product
	 */
	public function test_get_product_price_invalid() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$product_price = Wpcom_Products::get_product_pricing( 'invalid' );
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$this->assertSame( array(), $product_price );

	}

}
