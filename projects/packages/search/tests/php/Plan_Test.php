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
	 * Initialize static member `$plan`
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		static::$plan = new Plan();
		static::$plan->init_hooks();
	}

	/**
	 * Reset the per-request "already attempted a live fetch" static so each
	 * test starts as its own request would.
	 */
	public function setUp(): void {
		parent::setUp();
		$prop = ( new \ReflectionClass( Plan::class ) )->getProperty( 'fetch_attempted_this_request' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, array() );
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
	 * A failed ambient (non-forced) plan lookup sets the cross-request backoff,
	 * and while it's active subsequent ambient lookups don't issue further
	 * HTTP requests.
	 */
	public function test_get_plan_info_ambient_backoff_suppresses_further_requests() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );

		$request_count = 0;
		$counter       = function ( $response, $parsed_args, $url ) use ( &$request_count ) {
			if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
				++$request_count;
				return new WP_Error( 'request_failed' );
			}
			return $response;
		};
		add_filter( 'pre_http_request', $counter, 20, 3 );

		for ( $i = 0; $i < 3; $i++ ) {
			$this->assertFalse( static::$plan->get_plan_info() );
		}

		remove_filter( 'pre_http_request', $counter, 20 );
		$this->assertSame( 1, $request_count );
	}

	/**
	 * `update_search_plan_info()` sets the backoff on failure and clears it
	 * again once a fetch succeeds.
	 */
	public function test_update_search_plan_info_backoff_lifecycle() {
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );

		static::$plan->update_search_plan_info( new WP_Error() );
		$this->assertNotFalse( get_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY ) );

		$response = $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' );
		static::$plan->update_search_plan_info( $response );
		$this->assertFalse( get_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY ) );
	}

	/**
	 * `ensure_plan_info_populated()` forces a live fetch, bypassing an active
	 * backoff, when there's no cached plan answer yet.
	 */
	public function test_ensure_plan_info_populated_forces_fetch_when_cache_empty() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		set_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY, true, Plan::PLAN_FETCH_BACKOFF_SECONDS );

		static::$plan->ensure_plan_info_populated();

		$this->assertNotEmpty( get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );
	}

	/**
	 * A failed fetch must not stack a second live request on top of
	 * get_plan_info()'s own implicit-retry fallback.
	 */
	public function test_ensure_plan_info_populated_makes_only_one_request_on_failure() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$request_count = 0;
		$counter       = function ( $response, $parsed_args, $url ) use ( &$request_count ) {
			if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
				++$request_count;
				return new WP_Error( 'request_failed' );
			}
			return $response;
		};
		add_filter( 'pre_http_request', $counter, 20, 3 );

		static::$plan->ensure_plan_info_populated();

		remove_filter( 'pre_http_request', $counter, 20 );
		$this->assertSame( 1, $request_count );
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );
	}

	/**
	 * Mirrors activate_plan()'s own fallback fetch immediately followed by
	 * Module_Control::activate()'s ensure_plan_info_populated() call in the
	 * same request: once the first attempt has run (and failed), a second
	 * call must not make another live request.
	 */
	public function test_ensure_plan_info_populated_skips_after_an_earlier_failed_attempt_this_request() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$request_count = 0;
		$counter       = function ( $response, $parsed_args, $url ) use ( &$request_count ) {
			if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
				++$request_count;
				return new WP_Error( 'request_failed' );
			}
			return $response;
		};
		add_filter( 'pre_http_request', $counter, 20, 3 );

		static::$plan->get_plan_info_from_wpcom();
		static::$plan->ensure_plan_info_populated();

		remove_filter( 'pre_http_request', $counter, 20 );
		$this->assertSame( 1, $request_count );
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );
	}

	/**
	 * A fetch attempt for one blog must not suppress ensure_plan_info_populated()
	 * for a different blog in the same process (e.g. a switch_to_blog() loop).
	 */
	public function test_ensure_plan_info_populated_is_scoped_per_blog() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		$request_count = 0;
		$counter       = function ( $response, $parsed_args, $url ) use ( &$request_count ) {
			if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
				++$request_count;
				return new WP_Error( 'request_failed' );
			}
			return $response;
		};
		add_filter( 'pre_http_request', $counter, 20, 3 );

		static::$plan->get_plan_info_from_wpcom();

		$other_blog_id = function ( $value, $name ) {
			return 'id' === $name ? '111' : $value;
		};
		add_filter( 'jetpack_options', $other_blog_id, 20, 2 );
		static::$plan->ensure_plan_info_populated();
		remove_filter( 'jetpack_options', $other_blog_id, 20 );

		remove_filter( 'pre_http_request', $counter, 20 );
		$this->assertSame( 2, $request_count );
		delete_transient( Plan::PLAN_FETCH_BACKOFF_TRANSIENT_KEY );
	}

	/**
	 * `ensure_plan_info_populated()` doesn't hit WPCOM when a cached answer
	 * already exists.
	 */
	public function test_ensure_plan_info_populated_skips_fetch_when_cache_populated() {
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, array( 'supports_search' => true ) );

		$request_count = 0;
		$counter       = function ( $response, $parsed_args, $url ) use ( &$request_count ) {
			if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
				++$request_count;
			}
			return $response;
		};
		add_filter( 'pre_http_request', $counter, 20, 3 );

		static::$plan->ensure_plan_info_populated();

		remove_filter( 'pre_http_request', $counter, 20 );
		$this->assertSame( 0, $request_count );
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
}
