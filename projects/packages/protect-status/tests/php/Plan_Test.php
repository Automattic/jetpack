<?php
/**
 * Tests for the Plan class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for the Plan class.
 *
 * Each row runs in its own process: a stubbed WordPress.com feature function stays defined for the rest of the run.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
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
	}

	/**
	 * Tear down after each test.
	 *
	 * @return void
	 */
	protected function tear_down() {
		remove_all_filters( 'pre_http_request' );
	}

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

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
	// has_required_plan()
	// -----------------------------------------------------------------------

	/**
	 * Sites by the features WordPress.com gates and grants (null off WordPress.com), the site's products, and whether the site has Scan.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		return array(
			'self-hosted, plan with scan'           => array( null, array(), array(), true ),
			'WordPress.com, scan only'              => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array(), false ),
			'WordPress.com, scan-self-serve'        => array( array( 'scan', 'scan-self-serve' ), array( 'scan', 'scan-self-serve' ), array(), true ),
			'WordPress.com, Scan product'           => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan' ), true ),
			'WordPress.com, bi-yearly Scan'         => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan_bi_yearly' ), true ),
			'WordPress.com, real-time Scan'         => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan_realtime_monthly' ), true ),
			'WordPress.com, another product'        => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_backup_t1_yearly' ), false ),
			'WordPress.com, no scan-self-serve yet' => array( array( 'scan' ), array( 'scan' ), array(), true ),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param string[]|null $known    Features WordPress.com gates, or null off WordPress.com.
	 * @param string[]      $entitled Features the WordPress.com site has.
	 * @param string[]      $products The site's product slugs.
	 * @param bool          $expected Whether the site has Scan.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_has_required_plan( $known, $entitled, $products, $expected ) {
		if ( null !== $known ) {
			$GLOBALS['wpcom_test_features'] = array(
				'known'    => $known,
				'entitled' => $entitled,
			);
			require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
		}
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_free',
				'features'     => array( 'active' => array( 'scan' ) ),
			)
		);
		update_option( 'jetpack_site_products', array_map( fn( $slug ) => array( 'product_slug' => $slug ), $products ) );

		$this->assertSame( $expected, Plan::has_required_plan() );
	}

	/**
	 * A plan refreshed mid-request, as My Jetpack's page render does, is read at once.
	 */
	public function test_has_required_plan_follows_a_refreshed_plan() {
		$this->assertFalse( Plan::has_required_plan() );

		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_free',
					'features'     => array( 'active' => array( 'scan' ) ),
				),
			)
		);

		$this->assertTrue( Plan::has_required_plan() );
	}

	// -----------------------------------------------------------------------
	// get_product() — cache behaviour
	// -----------------------------------------------------------------------

	/**
	 * Test get_product returns the cached value when the cache is still valid (under 7 days old).
	 */
	public function test_get_product_returns_cached_value_when_cache_is_fresh() {
		$expected_product = (object) array( 'product_slug' => 'jetpack_scan' );
		$this->seed_valid_cache( $expected_product, DAY_IN_SECONDS );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertEquals( $expected_product, $result, 'A fresh cache must be returned without a network request' );
	}

	/**
	 * Test get_product fetches from WPCOM when no cache entry exists for the current user.
	 */
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
	 * Test get_product fetches from WPCOM when the cache entry is older than 7 days.
	 */
	public function test_get_product_fetches_from_wpcom_when_cache_is_expired() {
		$stale_product = (object) array( 'product_slug' => 'jetpack_scan_stale' );
		$this->seed_valid_cache( $stale_product, 8 * DAY_IN_SECONDS );

		$fresh_product = (object) array(
			'product_slug' => 'jetpack_scan',
			'cost'         => 12.00,
		);
		$this->mock_wpcom_products_200( $fresh_product );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertEquals( $fresh_product, $result, 'An expired cache must trigger a new WPCOM fetch' );
	}

	/**
	 * Test get_product populates user-meta cache upon receiving a successful response.
	 */
	public function test_get_product_populates_cache_on_successful_fetch() {
		$product_payload = (object) array(
			'product_slug' => 'jetpack_scan',
			'title'        => 'Jetpack Scan',
		);
		$this->mock_wpcom_products_200( $product_payload );

		$before_call = time();
		Plan::get_product( 'jetpack_scan' );
		$after_call = time();

		$cached_product = get_user_meta( $this->user_id, Plan::CACHE_META_NAME, true );
		$cached_date    = (int) get_user_meta( $this->user_id, Plan::CACHE_DATE_META_NAME, true );

		$this->assertEquals( $product_payload, $cached_product, 'The product payload must be persisted in user-meta' );
		$this->assertGreaterThanOrEqual( $before_call, $cached_date, 'Cache timestamp must be on or after the call start time' );
		$this->assertLessThanOrEqual( $after_call, $cached_date, 'Cache timestamp must be on or before the call end time' );
	}

	/**
	 * Test get_product includes the current user locale in the outbound WPCOM URL.
	 */
	public function test_get_product_passes_user_locale_in_request_url() {
		switch_to_locale( 'de_DE' );

		$captured_url = null;
		add_filter(
			'pre_http_request',
			static function ( $pre, $parsed_args, $url ) use ( &$captured_url ) {
				$captured_url = $url;
				return array(
					'body'     => wp_json_encode( (object) array( 'jetpack_scan' => (object) array() ) ),
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			},
			10,
			3
		);

		try {
			Plan::get_product( 'jetpack_scan' );
		} finally {
			restore_previous_locale();
		}

		$this->assertNotNull( $captured_url, 'An outbound request must be made' );
		$this->assertStringContainsString( 'locale=de_DE', $captured_url, 'The user locale must be embedded as a query parameter' );
	}

	/**
	 * Data provider: non-200 HTTP response codes.
	 *
	 * @return array[]
	 */
	public static function non_200_response_codes() {
		return array(
			'400 Bad Request'           => array( 400 ),
			'401 Unauthorized'          => array( 401 ),
			'403 Forbidden'             => array( 403 ),
			'404 Not Found'             => array( 404 ),
			'500 Internal Server Error' => array( 500 ),
			'503 Service Unavailable'   => array( 503 ),
		);
	}

	/**
	 * Test get_product returns a WP_Error with code failed_to_fetch_data for each non-200 response.
	 *
	 * @param int $code HTTP response code.
	 *
	 * @dataProvider non_200_response_codes
	 */
	#[DataProvider( 'non_200_response_codes' )]
	public function test_get_product_returns_wp_error_on_non_200_http_response( $code ) {
		$this->mock_wpcom_products_error( $code );

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertInstanceOf( WP_Error::class, $result, "HTTP status {$code} must result in a WP_Error instance" );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code(), 'Error code must match failed_to_fetch_data' );

		$error_data = $result->get_error_data();
		$this->assertIsArray( $error_data, 'Error data must be an array' );
		$this->assertSame( $code, $error_data['status'], "Error data status must equal {$code}" );
	}

	/**
	 * Test get_product propagates WP_Error when wp_remote_get itself returns a WP_Error.
	 */
	public function test_get_product_returns_wp_error_on_http_transport_failure() {
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'http_request_failed', 'cURL error 28: Connection timed out' );
			}
		);

		$result = Plan::get_product( 'jetpack_scan' );

		$this->assertInstanceOf( WP_Error::class, $result, 'A transport failure must result in a WP_Error instance' );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code(), 'Top-level error code must be failed_to_fetch_data' );

		$error_data = $result->get_error_data();
		$this->assertIsArray( $error_data, 'Error data must be an array' );
		$this->assertSame( '', $error_data['status'], 'Status code for a transport failure must be empty string' );
	}

	/**
	 * Test get_product does not write to user-meta when the network fetch fails.
	 */
	public function test_get_product_does_not_cache_error_response() {
		$this->mock_wpcom_products_error( 500 );

		Plan::get_product( 'jetpack_scan' );

		$this->assertEmpty(
			get_user_meta( $this->user_id, Plan::CACHE_META_NAME, true ),
			'Failed network response must not write product cache'
		);
		$this->assertEmpty(
			get_user_meta( $this->user_id, Plan::CACHE_DATE_META_NAME, true ),
			'Failed network response must not write cache timestamp'
		);
	}

	/**
	 * Test get_product extracts the requested product slug from the WPCOM products map.
	 */
	public function test_get_product_fetches_custom_product_slug() {
		$custom_product = (object) array(
			'product_slug' => 'jetpack_scan_tier2',
			'cost'         => 19.99,
		);
		$body = wp_json_encode( (object) array( 'jetpack_scan_tier2' => $custom_product ), JSON_UNESCAPED_SLASHES );

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

		$result = Plan::get_product( 'jetpack_scan_tier2' );

		$this->assertEquals( $custom_product, $result, 'get_product() must look up the exact requested slug key' );
	}
}
