<?php
/**
 * Tests for the Protect Plan class.
 *
 * @package automattic/jetpack-protect-status
 * @subpackage Tests
 */

namespace Automattic\Jetpack\Protect_Status;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\TestDox;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for the Plan class.
 */
class Plan_Test extends BaseTestCase {

	/**
	 * The ID of the user created for each test.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up before each test.
	 *
	 * @return void
	 */
	protected function set_up() {
		$this->user_id = wp_create_user( 'plan-test-user', 'password', 'plan-test@example.com' );
		wp_set_current_user( $this->user_id );
		$this->reset_has_scan_static();
	}

	/**
	 * Tear down after each test.
	 *
	 * @return void
	 */
	protected function tear_down() {
		remove_all_filters( 'pre_http_request' );
		$this->reset_has_scan_static();
	}

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	/**
	 * Reset the static `$has_scan` memo inside Plan::has_required_plan().
	 *
	 * @return void
	 */
	private function reset_has_scan_static() {
		delete_option( 'jetpack_active_plan' );
		delete_option( 'jetpack_site_products' );
		Plan::has_required_plan( true );
	}

	/**
	 * Register a pre_http_request stub that returns a 200 products response.
	 *
	 * @param object $product_payload Product object to embed in the JSON body.
	 *
	 * @return void
	 */
	private function mock_wpcom_products_200( $product_payload ) {
		$body = wp_json_encode( (object) array( 'jetpack_scan' => $product_payload ), JSON_UNESCAPED_SLASHES );

		add_filter(
			'pre_http_request',
			static function () use ( $body ) {
				return array(
					'body'     => $body,
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			}
		);
	}

	/**
	 * Register a pre_http_request stub that returns a non-200 error response.
	 *
	 * @param int $code HTTP status code to return.
	 *
	 * @return void
	 */
	private function mock_wpcom_products_error( $code = 500 ) {
		add_filter(
			'pre_http_request',
			static function () use ( $code ) {
				return array(
					'body'     => wp_json_encode( array(), JSON_UNESCAPED_SLASHES ),
					'response' => array(
						'code'    => $code,
						'message' => 'Error',
					),
				);
			}
		);
	}

	/**
	 * Write a cache entry to user-meta as if a previous fetch had populated it.
	 *
	 * @param mixed $product        The value to store in the product-cache meta.
	 * @param int   $age_in_seconds How many seconds ago the cache was written.
	 *
	 * @return void
	 */
	private function seed_valid_cache( $product = 'cached_product', $age_in_seconds = 0 ) {
		update_user_meta( $this->user_id, Plan::CACHE_META_NAME, $product );
		update_user_meta( $this->user_id, Plan::CACHE_DATE_META_NAME, time() - $age_in_seconds );
	}

	// -----------------------------------------------------------------------
	// get_product() — cache behaviour
	// -----------------------------------------------------------------------

	/**
	 * @testdox get_product() returns the cached value when the cache is still valid (under 7 days old).
	 *
	 * @return void
	 */
	#[TestDox( 'get_product() returns the cached value when the cache is still valid (under 7 days old).' )]
	public function test_get_product_returns_cached_value_when_cache_is_fresh() {
		$expected_product = (object) array( 'product_slug' => 'jetpack_scan' );
		$this->seed_valid_cache( $expected_product, DAY_IN_SECONDS );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertEquals( $expected_product, $result, 'A fresh cache must be returned without a network request' );
	}

	/**
	 * @testdox get_product() fetches from WPCOM when no cache entry exists for the current user.
	 *
	 * @return void
	 */
	#[TestDox( 'get_product() fetches from WPCOM when no cache entry exists for the current user.' )]
	public function test_get_product_fetches_from_wpcom_when_cache_is_absent() {
		$product_payload = (object) array(
			'product_slug' => 'jetpack_scan',
			'cost'         => 9.95,
		);
		$this->mock_wpcom_products_200( $product_payload );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertEquals( $product_payload, $result, 'When no cache exists, the WPCOM API response must be returned' );
	}

	/**
	 * @testdox get_product() fetches from WPCOM when the cache entry is older than 7 days.
	 *
	 * @return void
	 */
	#[TestDox( 'get_product() fetches from WPCOM when the cache entry is older than 7 days.' )]
	public function test_get_product_fetches_from_wpcom_when_cache_is_expired() {
		$stale_product = (object) array( 'product_slug' => 'stale' );
		$fresh_product = (object) array(
			'product_slug' => 'jetpack_scan',
			'cost'         => 9.95,
		);
		$this->seed_valid_cache( $stale_product, 8 * DAY_IN_SECONDS );
		$this->mock_wpcom_products_200( $fresh_product );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertNotEquals( $stale_product, $result, 'An expired cache must not be returned' );
		$this->assertEquals( $fresh_product, $result, 'The fresh WPCOM API response must be returned after cache expiry' );
	}

	// -----------------------------------------------------------------------
	// get_product() — caching side-effects on 200
	// -----------------------------------------------------------------------

	/**
	 * @testdox get_product() stores the product and timestamp in user-meta after a successful 200 fetch.
	 *
	 * @return void
	 */
	#[TestDox( 'get_product() stores the product and timestamp in user-meta after a successful 200 fetch.' )]
	public function test_get_product_stores_product_and_date_meta_on_200_response() {
		$product_payload = (object) array( 'product_slug' => 'jetpack_scan' );
		$this->mock_wpcom_products_200( $product_payload );

		$before = time();
		Plan::get_product( 'jetpack_scan' );
		$after = time();

		$cached_product = get_user_meta( $this->user_id, Plan::CACHE_META_NAME, true );
		$cached_date    = (int) get_user_meta( $this->user_id, Plan::CACHE_DATE_META_NAME, true );

		$this->assertEquals( $product_payload, $cached_product, 'Product must be written to user-meta after a 200 response' );
		$this->assertGreaterThanOrEqual( $before, $cached_date, 'Cache date must be >= timestamp recorded before the call' );
		$this->assertLessThanOrEqual( $after, $cached_date, 'Cache date must be <= timestamp recorded after the call' );
	}

	/**
	 * @testdox get_product() does NOT write to user-meta on a non-200 response.
	 *
	 * @return void
	 */
	#[TestDox( 'get_product() does NOT write to user-meta on a non-200 response.' )]
	public function test_get_product_does_not_store_meta_on_non_200_response() {
		$this->mock_wpcom_products_error( 503 );

		Plan::get_product( 'jetpack_scan' );

		$cached_product = get_user_meta( $this->user_id, Plan::CACHE_META_NAME, true );
		$cached_date    = get_user_meta( $this->user_id, Plan::CACHE_DATE_META_NAME, true );

		$this->assertEmpty( $cached_product, 'Product must NOT be written to user-meta on a non-200 response' );
		$this->assertEmpty( $cached_date, 'Cache date must NOT be written to user-meta on a non-200 response' );
	}

	// -----------------------------------------------------------------------
	// get_product() — WP_Error on non-200
	// -----------------------------------------------------------------------

	/**
	 * Data provider: non-200 HTTP response codes.
	 *
	 * @return array[]
	 */
	public static function non_200_response_codes() {
		return array(
			'400 Bad Request'           => array( 400 ),
			'401 Unauthorized'          => array( 401 ),
			'404 Not Found'             => array( 404 ),
			'500 Internal Server Error' => array( 500 ),
			'503 Service Unavailable'   => array( 503 ),
		);
	}

	/**
	 * @testdox get_product() returns a WP_Error with code 'failed_to_fetch_data' for each non-200 response.
	 *
	 * @param int $code HTTP response code.
	 *
	 * @dataProvider non_200_response_codes
	 *
	 * @return void
	 */
	#[DataProvider( 'non_200_response_codes' )]
	#[TestDox( 'get_product() returns a WP_Error with code \'failed_to_fetch_data\' for each non-200 response.' )]
	public function test_get_product_returns_wp_error_on_non_200( $code ) {
		remove_all_filters( 'pre_http_request' );
		$this->mock_wpcom_products_error( $code );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertInstanceOf( WP_Error::class, $result, "get_product() must return a WP_Error for HTTP {$code}" );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code(), "WP_Error code must be 'failed_to_fetch_data' for HTTP {$code}" );
		$this->assertSame( $code, $result->get_error_data()['status'], "WP_Error data['status'] must equal {$code}" );
	}

	// -----------------------------------------------------------------------
	// has_required_plan() — plan feature support
	// -----------------------------------------------------------------------

	/**
	 * @testdox has_required_plan() returns true when the active plan supports 'scan'.
	 *
	 * @return void
	 */
	#[TestDox( 'has_required_plan() returns true when the active plan supports \'scan\'.' )]
	public function test_has_required_plan_returns_true_when_plan_supports_scan() {
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_security_daily',
					'features'     => array(
						'active'    => array( 'scan' ),
						'available' => array(),
					),
				),
			)
		);

		$this->assertTrue( Plan::has_required_plan( true ), 'A plan that supports scan must return true' );
	}

	/**
	 * @testdox has_required_plan() returns false when the free plan has no scan feature or product.
	 *
	 * @return void
	 */
	#[TestDox( 'has_required_plan() returns false when the free plan has no scan feature or product.' )]
	public function test_has_required_plan_returns_false_when_no_scan_plan() {
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array(
						'active'    => array(),
						'available' => array(),
					),
				),
				'products' => array(),
			)
		);

		$this->assertFalse( Plan::has_required_plan( true ), 'A free plan without a scan product must return false' );
	}

	// -----------------------------------------------------------------------
	// has_required_plan() — product list
	// -----------------------------------------------------------------------

	/**
	 * Data provider: product slugs that grant the Protect paid tier.
	 *
	 * @return array[]
	 */
	public static function scan_eligible_products() {
		return array(
			'jetpack_scan'         => array( 'jetpack_scan' ),
			'jetpack_scan_monthly' => array( 'jetpack_scan_monthly' ),
		);
	}

	/**
	 * @testdox has_required_plan() returns true when the site has a scan-eligible product slug.
	 *
	 * @param string $product_slug The product slug to attach to the site record.
	 *
	 * @dataProvider scan_eligible_products
	 *
	 * @return void
	 */
	#[DataProvider( 'scan_eligible_products' )]
	#[TestDox( 'has_required_plan() returns true when the site has a scan-eligible product slug.' )]
	public function test_has_required_plan_returns_true_with_scan_product( $product_slug ) {
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array(
						'active'    => array(),
						'available' => array(),
					),
				),
				'products' => array(
					array( 'product_slug' => $product_slug ),
				),
			)
		);

		$this->assertTrue(
			Plan::has_required_plan( true ),
			"Product '{$product_slug}' must satisfy has_required_plan()"
		);
	}

	// -----------------------------------------------------------------------
	// has_required_plan() — memoisation and force_refresh
	// -----------------------------------------------------------------------

	/**
	 * @testdox has_required_plan() memoises its result so a second call without force_refresh is identical.
	 *
	 * @return void
	 */
	#[TestDox( 'has_required_plan() memoises its result so a second call without force_refresh is identical.' )]
	public function test_has_required_plan_memoises_result() {
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array(
						'active'    => array(),
						'available' => array(),
					),
				),
				'products' => array(),
			)
		);

		$first_call  = Plan::has_required_plan( true );
		$second_call = Plan::has_required_plan();

		$this->assertSame( $first_call, $second_call, 'Repeated calls without force_refresh must return the memoised result' );
	}

	/**
	 * @testdox has_required_plan() with force_refresh detects a plan upgrade within the same request lifecycle.
	 *
	 * @return void
	 */
	#[TestDox( 'has_required_plan() with force_refresh detects a plan upgrade within the same request lifecycle.' )]
	public function test_has_required_plan_force_refresh_detects_plan_upgrade() {
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array(
						'active'    => array(),
						'available' => array(),
					),
				),
				'products' => array(),
			)
		);
		$before_upgrade = Plan::has_required_plan( true );

		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan'     => array(
					'product_slug' => 'jetpack_free',
					'features'     => array(
						'active'    => array(),
						'available' => array(),
					),
				),
				'products' => array(
					array( 'product_slug' => 'jetpack_scan' ),
				),
			)
		);
		$after_upgrade = Plan::has_required_plan( true );

		$this->assertFalse( $before_upgrade, 'Before the upgrade, has_required_plan() must be false' );
		$this->assertTrue( $after_upgrade, 'After adding a scan product, force_refresh must detect the upgrade and return true' );
	}
}
