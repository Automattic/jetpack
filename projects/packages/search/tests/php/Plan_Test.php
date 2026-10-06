<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use Automattic\Jetpack\Status\Cache;
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

	public function test_online_lookup_fetches_and_refreshes_plan() {
		Cache::set( 'is_offline_mode', false );
		$requests = 0;
		$spy      = function ( $preempt ) use ( &$requests ) {
			++$requests;
			return $preempt;
		};
		add_filter( 'pre_http_request', $spy, 5 );

		try {
			$expected = json_decode( self::PLAN_INFO_FIXTURE, true );
			$this->assertSame( $expected, static::$plan->get_plan_info() );
			$this->assertSame( 1, $requests );
			update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, array( 'supports_search' => false ) );
			$this->assertSame( $expected, static::$plan->get_plan_info( true ) );
			$this->assertSame( 2, $requests );
			$this->assertSame( $expected, get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY ) );
		} finally {
			remove_filter( 'pre_http_request', $spy, 5 );
			Cache::set( 'is_offline_mode', null );
		}
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
