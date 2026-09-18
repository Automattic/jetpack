<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use WP_Error;

/**
 * Unit tests for the Plan class.
 *
 * @package automattic/jetpack-search
 */
class Plan_Test extends Search_TestCase {
	/**
	 * Plan object.
	 *
	 * @var Plan
	 */
	protected static $plan;

	/**
	 * Number of intercepted plan requests in this test.
	 *
	 * @var int
	 */
	private $plan_request_count = 0;

	/**
	 * Count and fail plan requests without duplicating HTTP filters in each test.
	 */
	private function mock_failed_plan_requests() {
		add_filter( 'pre_http_request', array( $this, 'fail_plan_request' ), 20, 3 );
	}

	/**
	 * Intercept only the plan endpoint.
	 *
	 * @param mixed  $response HTTP response override.
	 * @param array  $args Request arguments.
	 * @param string $url Request URL.
	 * @return mixed
	 */
	public function fail_plan_request( $response, $args, $url ) {
		if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
			++$this->plan_request_count;
			return new WP_Error( 'request_failed' );
		}
		return $response;
	}

	/**
	 * Remove the HTTP override even when an assertion fails.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'fail_plan_request' ), 20 );
		$this->restore_plan_hooks();
		parent::tearDown();
	}

	/**
	 * Reset the per-request "already attempted a live fetch" static so each
	 * test starts as its own request would.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->isolate_plan_hooks();
		static::$plan = new Plan();
		static::$plan->init_hooks();
		$prop = ( new \ReflectionClass( Plan::class ) )->getProperty( 'fetch_attempted_this_request' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, array() );
		static::$plan->set_plan_options( json_decode( $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' )['body'], true ) );
	}

	/**
	 * Missing blog IDs must not generate HTTP requests.
	 */
	public function test_missing_blog_id_does_not_fetch() {
		$this->mock_failed_plan_requests();
		$missing_id = function ( $value, $name ) {
			return 'id' === $name ? false : $value;
		};
		add_filter( 'jetpack_options', $missing_id, 20, 2 );
		try {
			$response = static::$plan->get_plan_info_from_wpcom();
			$this->assertInstanceOf( WP_Error::class, $response );
			$this->assertSame( 'site_not_registered', $response->get_error_code() );
			$this->assertSame( 0, $this->plan_request_count );
		} finally {
			remove_filter( 'jetpack_options', $missing_id, 20 );
		}
	}

	/**
	 * Testing `get_plan_info_from_wpcom`
	 */
	public function test_get_plan_info_from_wpcom() {
		$plan_info = static::$plan->get_plan_info_from_wpcom();
		$this->assertEquals( 200, $plan_info['response']['code'] );
		$this->assertTrue( strpos( $plan_info['body'], '"supports_search"' ) !== false );
	}

	/**
	 * Test `get_plan_info`
	 */
	public function test_get_plan_info() {
		$plan_info = static::$plan->get_plan_info();
		$this->assertTrue( $plan_info['supports_search'] );
		$this->assertFalse( $plan_info['supports_instant_search'] );
	}

	/**
	 * Missing cached data must never cause a synchronous HTTP request.
	 */
	public function test_get_plan_info_with_empty_cache_never_fetches() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$this->mock_failed_plan_requests();

		for ( $i = 0; $i < 3; $i++ ) {
			$this->assertFalse( static::$plan->get_plan_info() );
		}

		$this->assertSame( 0, $this->plan_request_count );
	}

	/**
	 * Explicit activation fetches missing plan information.
	 */
	public function test_ensure_plan_info_populated_forces_fetch_when_cache_empty() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		static::$plan->ensure_plan_info_populated();

		$this->assertNotEmpty( get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
	}

	/**
	 * Activation must not repeat a failed plan fetch from the same request.
	 */
	public function test_ensure_plan_info_populated_skips_after_an_earlier_failed_attempt_this_request() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$this->mock_failed_plan_requests();

		static::$plan->get_plan_info_from_wpcom();
		static::$plan->ensure_plan_info_populated();

		$this->assertSame( 1, $this->plan_request_count );
	}

	/**
	 * A fetch attempt for one blog must not suppress ensure_plan_info_populated()
	 * for a different blog in the same process (e.g. a switch_to_blog() loop).
	 */
	public function test_ensure_plan_info_populated_is_scoped_per_blog() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$this->mock_failed_plan_requests();

		static::$plan->get_plan_info_from_wpcom();

		$other_blog_id = function ( $value, $name ) {
			return 'id' === $name ? '111' : $value;
		};
		add_filter( 'jetpack_options', $other_blog_id, 20, 2 );
		static::$plan->ensure_plan_info_populated();
		remove_filter( 'jetpack_options', $other_blog_id, 20 );

		$this->assertSame( 2, $this->plan_request_count );
	}

	/**
	 * `ensure_plan_info_populated()` doesn't hit WPCOM when a cached answer
	 * already exists.
	 */
	public function test_ensure_plan_info_populated_skips_fetch_when_cache_populated() {
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, array( 'supports_search' => true ) );

		$this->mock_failed_plan_requests();

		static::$plan->ensure_plan_info_populated();

		$this->assertSame( 0, $this->plan_request_count );
	}

	/**
	 * Test `has_jetpack_search_product`
	 */
	public function test_has_jetpack_search_product() {
		update_option( 'has_jetpack_search_product', true );
		$this->assertTrue( static::$plan->has_jetpack_search_product() );
	}

	/**
	 * Test `supports_instant_search`
	 */
	public function test_supports_instant_search() {
		$this->assertFalse( static::$plan->supports_instant_search() );
		$plan_info                            = json_decode( $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' )['body'], true );
		$plan_info['supports_instant_search'] = true;
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $plan_info );
		$this->assertTrue( static::$plan->supports_instant_search() );
	}

	/**
	 * Test `supports_search`
	 */
	public function test_supports_search() {
		$this->assertTrue( static::$plan->supports_search() );
		$plan_info                    = json_decode( $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' )['body'], true );
		$plan_info['supports_search'] = false;
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $plan_info );
		$this->assertFalse( static::$plan->supports_search() );
	}

	/**
	 * Test `supports_only_classic_search`
	 */
	public function test_supports_only_classic_search() {
		$this->assertTrue( static::$plan->supports_only_classic_search() );
	}

	/**
	 * Test `update_search_plan_info`
	 */
	public function test_update_search_plan_info() {
		$this->assertFalse( static::$plan->update_search_plan_info( new WP_Error() ) );
		$this->assertFalse( static::$plan->update_search_plan_info( array( 'response' => array( 'code' => 500 ) ) ) );
		$this->assertFalse( static::$plan->update_search_plan_info( array() ) );

		$response = $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' );
		static::$plan->update_search_plan_info( $response );
		$this->assertEquals( json_decode( $response['body'], true ), static::$plan->get_plan_info() );
		$this->assertFalse( static::$plan->has_jetpack_search_product() );
	}

	/**
	 * Test `ever_supported_search`
	 */
	public function test_ever_supported_search() {
		$this->assertTrue( static::$plan->ever_supported_search() );

		add_filter( 'option_' . Plan::JETPACK_SEARCH_EVER_SUPPORTED_SEARCH, '__return_false' );
		add_filter( 'option_has_jetpack_search_product', '__return_false' );
		add_filter( 'option_' . Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, '__return_false' );
		$this->assertFalse( static::$plan->ever_supported_search() );
		remove_filter( 'option_' . Plan::JETPACK_SEARCH_EVER_SUPPORTED_SEARCH, '__return_false' );
		remove_filter( 'option_has_jetpack_search_product', '__return_false' );
		remove_filter( 'option_' . Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, '__return_false' );

		add_filter( 'option_' . Plan::JETPACK_SEARCH_EVER_SUPPORTED_SEARCH, '__return_false' );
		add_filter( 'option_has_jetpack_search_product', '__return_false' );
		$this->assertTrue( static::$plan->ever_supported_search() );
		remove_filter( 'option_' . Plan::JETPACK_SEARCH_EVER_SUPPORTED_SEARCH, '__return_false' );
		remove_filter( 'option_has_jetpack_search_product', '__return_false' );
	}

	/**
	 * Test update data on heartbeat
	 */
	public function test_update_data_on_heartbeat() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		$this->assertEmpty( get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
		do_action( 'jetpack_heartbeat' );
		$this->assertNotEmpty( get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
	}
	/**
	 * Testing `get_plan_info_from_wpcom` bails without a blog ID instead of
	 * requesting the malformed `/sites//jetpack-search/plan` path.
	 */
	public function test_get_plan_info_from_wpcom_bails_without_blog_id() {
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10 );

		$requested = false;
		$spy       = function ( $preempt ) use ( &$requested ) {
			$requested = true;
			return $preempt;
		};
		add_filter( 'pre_http_request', $spy, 5 );

		$result = static::$plan->get_plan_info_from_wpcom();

		remove_filter( 'pre_http_request', $spy, 5 );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'site_not_registered', $result->get_error_code() );
		$this->assertFalse( $requested );
	}
}
