<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Testing `get_plan_info_from_wpcom`
	 */
	public function test_get_plan_info_from_wpcom() {
		$plan_info = static::$plan->get_plan_info_from_wpcom();
		$this->assertEquals( 200, $plan_info['response']['code'] );
		$this->assertTrue( strpos( $plan_info['body'], '"supports_search"' ) !== false );
	}

	public function test_offline_lookup_leaves_missing_plan_unchanged() {
		Cache::set( 'is_offline_mode', true );
		$requests = 0;
		$spy      = function ( $preempt ) use ( &$requests ) {
			++$requests;
			return $preempt;
		};
		add_filter( 'pre_http_request', $spy, 5 );

		try {
			$this->assertFalse( static::$plan->get_plan_info() );
			$result = static::$plan->get_plan_info_from_wpcom();
			$this->assertInstanceOf( WP_Error::class, $result );
			$this->assertSame( 'site_offline', $result->get_error_code() );
			$this->assertFalse( static::$plan->get_plan_info( true ) );
			do_action( 'jetpack_heartbeat' );
			$this->assertSame( 0, $requests );
			$this->assertFalse( get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
			$this->assertFalse( get_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT ) );
		} finally {
			remove_filter( 'pre_http_request', $spy, 5 );
			Cache::set( 'is_offline_mode', null );
		}
	}

	public function test_offline_lookup_preserves_cached_plan() {
		Cache::set( 'is_offline_mode', true );
		$cached_plan = array(
			'supports_search'         => true,
			'supports_instant_search' => true,
		);
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $cached_plan );

		try {
			$this->assertSame( $cached_plan, static::$plan->get_plan_info() );
			$this->assertSame( $cached_plan, static::$plan->get_plan_info( true ) );
			$this->assertSame( $cached_plan, get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
		} finally {
			Cache::set( 'is_offline_mode', null );
		}
	}

	/**
	 * Failed lookup responses.
	 *
	 * @return array
	 */
	public static function provide_failed_lookup_responses() {
		return array(
			'401 from WPCOM'   => array(
				array(
					'response' => array(
						'code'    => 401,
						'message' => 'Unauthorized',
					),
					'body'     => '{"error":"invalid_token"}',
				),
			),
			'transport error'  => array( new WP_Error( 'http_request_failed', 'cURL error 28' ) ),
			'200 without plan' => array(
				array(
					'response' => array(
						'code'    => 200,
						'message' => 'ok',
					),
					'body'     => '{}',
				),
			),
		);
	}

	/**
	 * Test that a failed implicit lookup is not repeated, while a failed explicit refresh doesn't throttle.
	 *
	 * @dataProvider provide_failed_lookup_responses
	 *
	 * @param array|WP_Error $failure - Mocked HTTP response.
	 */
	#[DataProvider( 'provide_failed_lookup_responses' )]
	public function test_failed_implicit_lookup_is_not_repeated( $failure ) {
		// Whether the lookup lock was held when each plan request was sent.
		$locked = array();
		$mock   = function ( $preempt, $args, $url ) use ( &$locked, $failure ) {
			if ( strpos( $url, '/jetpack-search/plan' ) === false ) {
				return $preempt;
			}
			$locked[] = (bool) get_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT );
			return $failure;
		};
		// After the base fixture (priority 10), which would otherwise answer with a 200.
		add_filter( 'pre_http_request', $mock, 20, 3 );

		try {
			static::$plan->get_plan_info_from_wpcom();
			$this->assertFalse( get_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT ) );

			$this->assertFalse( static::$plan->get_plan_info() );
			$this->assertFalse( static::$plan->supports_search() );
			$this->assertSame( array( false, true ), $locked );
		} finally {
			remove_filter( 'pre_http_request', $mock, 20 );
		}
	}

	/**
	 * Test that a forced refresh ignores a recorded failure, and that its success clears it.
	 */
	public function test_forced_refresh_ignores_and_clears_failed_lookup() {
		set_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT, true, Plan::PLAN_INFO_FETCH_FAILED_TTL );
		$this->assertFalse( static::$plan->get_plan_info() );

		$plan_info = static::$plan->get_plan_info( true );

		$this->assertTrue( $plan_info['supports_search'] );
		$this->assertFalse( get_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT ) );
	}

	/**
	 * Test that changing the stored connection tokens clears a recorded failure.
	 */
	public function test_token_change_clears_failed_lookup() {
		set_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT, true, Plan::PLAN_INFO_FETCH_FAILED_TTL );

		update_option( 'jetpack_private_options', array( 'blog_token' => 'fixed.token' ) );

		$this->assertFalse( get_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT ) );
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
