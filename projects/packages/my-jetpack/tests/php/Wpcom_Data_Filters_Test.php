<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the data-layer short-circuit filters.
 *
 * My Jetpack reads its products, purchases, plan, features and site info from WordPress.com over
 * a blog-token-signed HTTP request. WordPress.com Simple sites have no blog token, so those
 * requests cannot succeed there. Each of these filters lets a host that already holds the data
 * locally inject it and skip the request entirely.
 *
 * The contract each test locks down is the same, and it is the whole point of the filters: when
 * the filter returns a value, NO HTTP request is made. We assert that by failing the test from a
 * pre_http_request hook — if the request layer is ever reached, the test fails loudly rather than
 * silently passing on cached or mocked data.
 *
 * Several of the filtered methods memoize into a function static, which would leak across tests in
 * the same process, so those run isolated.
 *
 * @package automattic/my-jetpack
 */
class Wpcom_Data_Filters_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		// Mock a site connection, so the code under test takes the connected (blog-token) path and
		// would otherwise attempt a real request.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		// These filters are global and would otherwise leak into sibling test classes, where they
		// would silently stand in for the real WordPress.com lookups.
		remove_all_filters( 'my_jetpack_site_purchases' );
		remove_all_filters( 'my_jetpack_site_features' );
		remove_all_filters( 'my_jetpack_site_info' );
		remove_all_filters( 'my_jetpack_products_catalog' );
		remove_all_filters( 'my_jetpack_site_current_plan' );
		remove_all_filters( 'pre_http_request' );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		Wpcom_Products::reset_request_failures();
	}

	/**
	 * Fails the test if any HTTP request is attempted.
	 *
	 * Hooked to pre_http_request, which fires before the transport layer for every outbound
	 * request. Reaching it means the filter under test did not short-circuit.
	 *
	 * @param false|array|\WP_Error $preempt A preemptive return value of an HTTP request.
	 * @param array                 $args    Request arguments.
	 * @param string                $url     The request URL.
	 * @return never
	 */
	public function fail_on_http_request( $preempt, $args, $url ) {
		$this->fail( 'No HTTP request should be made when the data-layer filter short-circuits. Requested: ' . $url );
	}

	/**
	 * Registers the guard that fails the test on any outbound HTTP request.
	 */
	private function forbid_http_requests() {
		add_filter( 'pre_http_request', array( $this, 'fail_on_http_request' ), 10, 3 );
	}

	/**
	 * Test that the purchases filter short-circuits the request.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_site_purchases_filter_short_circuits_the_request() {
		$this->forbid_http_requests();

		$purchases = array(
			(object) array(
				'ID'           => 1,
				'product_slug' => 'jetpack_search',
			),
		);

		add_filter(
			'my_jetpack_site_purchases',
			function () use ( $purchases ) {
				return $purchases;
			}
		);

		$this->assertSame( $purchases, Wpcom_Products::get_site_current_purchases() );
	}

	/**
	 * Test that the site features filter short-circuits the request.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_site_features_filter_short_circuits_the_request() {
		$this->forbid_http_requests();

		$features = array(
			'active'    => array( 'search' ),
			'available' => array( 'search' => array( 'jetpack_search' ) ),
		);

		add_filter(
			'my_jetpack_site_features',
			function () use ( $features ) {
				return $features;
			}
		);

		$this->assertSame( $features, Product::get_site_features_from_wpcom() );
	}

	/**
	 * Test that the site info filter short-circuits the request.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_site_info_filter_short_circuits_the_request() {
		$this->forbid_http_requests();

		$site_info = (object) array( 'ID' => 123 );

		add_filter(
			'my_jetpack_site_info',
			function () use ( $site_info ) {
				return $site_info;
			}
		);

		$this->assertSame( $site_info, Initializer::get_site_info() );
	}

	/**
	 * Test that the products catalog filter short-circuits the request.
	 *
	 * Also asserts the filter wins over the user-meta cache path, which is why it sits at the very
	 * top of get_products().
	 */
	public function test_products_catalog_filter_short_circuits_the_request() {
		$this->forbid_http_requests();

		$catalog = (object) array(
			'jetpack_search' => (object) array(
				'product_slug' => 'jetpack_search',
				'cost'         => 10,
			),
		);

		add_filter(
			'my_jetpack_products_catalog',
			function () use ( $catalog ) {
				return $catalog;
			}
		);

		$this->assertSame( $catalog, Wpcom_Products::get_products() );
	}

	/**
	 * Test that the products catalog filter applies even with no logged-in user.
	 *
	 * Unfiltered, get_products() returns null when there is no user. The filter is checked first so
	 * that hosts serving the catalog locally are not subject to that restriction.
	 */
	public function test_products_catalog_filter_applies_without_a_user() {
		$this->forbid_http_requests();
		wp_set_current_user( 0 );

		$catalog = (object) array( 'jetpack_search' => (object) array( 'product_slug' => 'jetpack_search' ) );

		add_filter(
			'my_jetpack_products_catalog',
			function () use ( $catalog ) {
				return $catalog;
			}
		);

		$this->assertSame( $catalog, Wpcom_Products::get_products() );
	}

	/**
	 * Test that the current plan filter short-circuits the refresh from WordPress.com.
	 *
	 * Passing $reload = true would otherwise call Current_Plan::refresh_from_wpcom().
	 */
	public function test_site_current_plan_filter_short_circuits_the_refresh() {
		$this->forbid_http_requests();

		$plan = array(
			'product_slug' => 'jetpack_business',
			'class'        => 'business',
		);

		add_filter(
			'my_jetpack_site_current_plan',
			function () use ( $plan ) {
				return $plan;
			}
		);

		$this->assertSame( $plan, Wpcom_Products::get_site_current_plan( true ) );
	}

	/**
	 * Test that an unfiltered lookup still reaches the request layer.
	 *
	 * The guard against regression: it proves the tests above pass because the filter short-circuits,
	 * not because the request layer is unreachable in this environment.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_unfiltered_lookup_still_requests_from_wpcom() {
		$requested_urls = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$requested_urls ) {
				$requested_urls[] = $url;
				return array(
					'body'     => wp_json_encode(
						array(
							'active'    => array(),
							'available' => array(),
						),
						JSON_UNESCAPED_SLASHES
					),
					'response' => array(
						'code'    => 200,
						'message' => '',
					),
				);
			},
			10,
			3
		);

		Product::get_site_features_from_wpcom();

		$this->assertNotEmpty( $requested_urls, 'Without a filter, the site features lookup should hit WordPress.com.' );
		$this->assertStringContainsString( '/sites/123/features', $requested_urls[0] );
	}
}
