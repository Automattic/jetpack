<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Complete;
use Automattic\Jetpack\My_Jetpack\Products\Pro;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Wpcom_Products_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
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
			'body'     => wp_json_encode( $this->get_mock_products_data(), JSON_UNESCAPED_SLASHES ),
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
				'product_term'           => 'one time',
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
				'product_term'           => 'month',
				'sale_coupon'            => (object) array(
					// Random dates (or are they?) so we always get the sale price.
					'start_date' => '2003-05-27',
					'expires'    => '2063-04-05',
					'discount'   => 50,
				),
			),
		);
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();

		Wpcom_Products::reset_request_failures();
		Wpcom_Products::reset_purchases_cache();
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
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
	 * Test that we get data from cache if a request fails.
	 * Second request succeeds, but we'll never know because we don't retry it.
	 */
	public function test_get_products_error_norepeat() {
		$this->create_user_and_login();

		add_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );

		$this->assertTrue( is_wp_error( $products ) );

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$products = Wpcom_Products::get_products();
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$this->assertTrue( is_wp_error( $products ) );
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
			'available'             => true,
			'currency_code'         => 'BRL',
			'full_price'            => 4.9,
			'discount_price'        => 2.45,
			'is_introductory_offer' => false,
			'introductory_offer'    => null,
			'product_term'          => 'month',
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
	/**
	 * Catalog availability must never enable unsupported Pro billing terms.
	 *
	 * @dataProvider bundle_availability
	 * @param mixed $availability Store availability field.
	 * @param bool  $expected Whether new sales are allowed.
	 */
	#[DataProvider( 'bundle_availability' )]
	public function test_bundle_availability( $availability, $expected ) {
		$this->create_user_and_login();
		Wpcom_Products::reset_purchases_cache();
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array(), HOUR_IN_SECONDS );
		$products = (object) array();
		foreach ( array(
			'jetpack_pro_yearly'         => 'year',
			'jetpack_pro_bi_yearly'      => 'two years',
			'jetpack_pro_monthly'        => 'month',
			'jetpack_complete'           => 'year',
			'jetpack_complete_bi_yearly' => 'two years',
			'jetpack_complete_monthly'   => 'month',
			'jetpack_security_t1_yearly' => 'year',
			'jetpack_growth_yearly'      => 'year',
		) as $slug => $term ) {
			$products->$slug = (object) array(
				'cost'          => 348,
				'currency_code' => 'USD',
				'product_term'  => $term,
			);
			if ( null !== $availability ) {
				$products->$slug->available = $availability;
			}
		}
		$filter = static fn() => array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( $products, JSON_UNESCAPED_SLASHES ),
		);
		add_filter( 'pre_http_request', $filter );
		try {
			$pro = Pro::get_pricing_for_ui();
			$this->assertSame( $expected, $pro['available'] );
			$this->assertSame( array( 'jetpack_pro_yearly', 'jetpack_pro_bi_yearly' ), array_column( $pro['terms'], 'wpcom_product_slug' ) );
			$this->assertSame( array( $expected, $expected ), array_column( $pro['terms'], 'available' ) );
		} finally {
			remove_filter( 'pre_http_request', $filter );
		}
	}

	/**
	 * Availability fixtures from the Store consumer contract.
	 *
	 * @return array
	 */
	public static function bundle_availability() {
		return array(
			'on'      => array( true, true ),
			'off'     => array( false, false ),
			'missing' => array( null, false ),
			'string'  => array( 'yes', false ),
			'integer' => array( 1, false ),
		);
	}

	/**
	 * Cached offers follow a remote launch and rollback; failures preserve prices without selling.
	 */
	public function test_launch_rollback_and_failed_refresh() {
		$this->create_user_and_login();
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array(), HOUR_IN_SECONDS );
		$available = false;
		$filter    = static function () use ( &$available ) {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					(object) array(
						'jetpack_pro_yearly' => array(
							'available'     => $available,
							'cost'          => 348,
							'currency_code' => 'USD',
							'product_term'  => 'year',
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			);
		};
		add_filter( 'pre_http_request', $filter );
		try {
			$this->assertFalse( Pro::get_pricing_for_ui()['available'] );
			$available = true;
			update_user_meta( self::$user_id, Wpcom_Products::CACHE_DATE_META_NAME, time() - 6 * MINUTE_IN_SECONDS );
			$this->assertTrue( Pro::get_pricing_for_ui()['available'] );
			$available = false;
			Wpcom_Products::get_products( true );
			$this->assertFalse( Pro::get_pricing_for_ui()['available'] );
			$available = true;
			Wpcom_Products::get_products( true );
		} finally {
			remove_filter( 'pre_http_request', $filter );
		}
		add_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );
		try {
			update_user_meta( self::$user_id, Wpcom_Products::CACHE_DATE_META_NAME, time() - 6 * MINUTE_IN_SECONDS );
			$pricing = Pro::get_pricing_for_ui();
			$this->assertFalse( $pricing['available'] );
			$this->assertSame( 348, $pricing['full_price'] );
		} finally {
			remove_filter( 'pre_http_request', array( $this, 'mock_error_response' ) );
		}
	}

	/**
	 * Recognize Pro purchases while sales are off without classifying them as Complete.
	 *
	 * @dataProvider pro_subscriptions
	 * @param string $slug Subscription slug.
	 */
	#[DataProvider( 'pro_subscriptions' )]
	public function test_pro_recognition_is_independent_of_sales( $slug ) {
		Wpcom_Products::reset_purchases_cache();
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array( (object) array( 'product_slug' => $slug ) ), HOUR_IN_SECONDS );
		$this->assertTrue( Pro::has_paid_plan_for_product() );
		$this->assertFalse( Complete::has_paid_plan_for_product() );
		$this->assertFalse( Complete::has_required_plan() );
	}

	/**
	 * Recognized billing terms, including support-only monthly.
	 *
	 * @return array
	 */
	public static function pro_subscriptions() {
		return array_map( static fn( $slug ) => array( $slug ), Pro::get_paid_plan_product_slugs() );
	}

	/**
	 * A protected subscription must not produce an incompatible Pro offer.
	 *
	 * @dataProvider support_assisted_changes
	 * @param string $slug Subscription slug.
	 */
	#[DataProvider( 'support_assisted_changes' )]
	public function test_existing_subscriptions_requiring_support_are_not_replaced( $slug ) {
		$this->create_user_and_login();
		Wpcom_Products::reset_purchases_cache();
		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, array( (object) array( 'product_slug' => $slug ) ), HOUR_IN_SECONDS );

		$filter = static fn() => array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				(object) array(
					'jetpack_pro_yearly'    => array(
						'available'     => true,
						'cost'          => 348,
						'currency_code' => 'USD',
						'product_term'  => 'year',
					),
					'jetpack_pro_bi_yearly' => array(
						'available'     => true,
						'cost'          => 552,
						'currency_code' => 'USD',
						'product_term'  => 'two years',
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
		add_filter( 'pre_http_request', $filter );
		try {
			$pricing = Pro::get_pricing_for_ui();
			$this->assertFalse( $pricing['available'] );
			$this->assertSame( array( false, false ), array_column( $pricing['terms'], 'available' ) );
		} finally {
			remove_filter( 'pre_http_request', $filter );
		}
	}

	/**
	 * Downgrades and subscriptions the standard Pro cart cannot replace.
	 *
	 * @return array
	 */
	public static function support_assisted_changes() {
		return array_map( static fn( $slug ) => array( $slug ), array( 'jetpack_complete', 'jetpack_complete_bi_yearly', 'jetpack_complete_monthly', 'jetpack_search', 'jetpack_stats_yearly', 'jetpack_backup_t2_yearly', 'jetpack_backup_realtime', 'jetpack_security_t2_yearly', 'jetpack_security_realtime', 'jetpack_monitor_yearly' ) );
	}
}
