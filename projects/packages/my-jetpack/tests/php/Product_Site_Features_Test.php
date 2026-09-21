<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;

/**
 * Unit tests for the caching in Product::get_site_features_from_wpcom().
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Product::get_site_features_from_wpcom
 */
class Product_Site_Features_Test extends TestCase {

	/**
	 * How many outbound HTTP requests the current test has attempted.
	 *
	 * @var int
	 */
	private $http_calls = 0;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->http_calls = 0;
		Product::reset_site_features_cache();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
		remove_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		remove_filter( 'pre_set_transient_' . Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, '__return_false' );
		Product::reset_site_features_cache();
		\Wpcom_Test_Features::reset();

		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Fails every outbound HTTP request and tallies how many were attempted.
	 *
	 * @return WP_Error
	 */
	public function fail_http_request() {
		++$this->http_calls;
		return new WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' );
	}

	/**
	 * Answers every outbound HTTP request with a 200 carrying one active feature.
	 *
	 * @return array
	 */
	public function succeed_http_request() {
		++$this->http_calls;
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'active'    => array( 'backups' ),
					'available' => array(),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * A failed lookup answers later callers rather than firing one request per product.
	 */
	public function test_failed_lookup_is_only_attempted_once() {
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );

		$first  = Product::get_site_features_from_wpcom();
		$second = Product::get_site_features_from_wpcom();

		$this->assertInstanceOf( WP_Error::class, $first );
		$this->assertInstanceOf( WP_Error::class, $second );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * A successful lookup answers later callers from the transient.
	 */
	public function test_successful_lookup_is_only_attempted_once() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );

		$first  = Product::get_site_features_from_wpcom();
		$second = Product::get_site_features_from_wpcom();

		$this->assertSame( array( 'backups' ), $first['active'] );
		$this->assertSame( $first, $second );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * When the transient write does not retain — an object cache evicting under load — the
	 * in-process memo still holds a dashboard render to a single WPCOM request.
	 */
	public function test_successful_lookup_is_only_attempted_once_when_the_transient_does_not_retain() {
		add_filter( 'pre_set_transient_' . Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, '__return_false' );
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );

		$first  = Product::get_site_features_from_wpcom();
		$second = Product::get_site_features_from_wpcom();

		$this->assertFalse( get_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY ), 'The transient retained, so this test would pass without the memo.' );
		$this->assertSame( array( 'backups' ), $first['active'] );
		$this->assertSame( $first, $second );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * A failed lookup must not keep answering once the cache is warm again, or a site that
	 * owns a product is offered an upsell for it for the rest of the request.
	 */
	public function test_warm_transient_outranks_a_failed_lookup() {
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
		$this->assertInstanceOf( WP_Error::class, Product::get_site_features_from_wpcom() );

		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => array( 'backups' ),
				'available' => array(),
			),
			Product::MY_JETPACK_SITE_FEATURES_CACHE_DURATION
		);

		$features = Product::get_site_features_from_wpcom();

		$this->assertIsArray( $features );
		$this->assertSame( array( 'backups' ), $features['active'] );
		$this->assertTrue( Product::does_site_have_feature( 'backups' ) );
	}

	/**
	 * On a WordPress.com host the platform answers in-process, so nothing is fetched.
	 */
	public function test_wpcom_host_answers_a_held_feature_without_a_request() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		$this->simulate_wpcom_site( array( 'scan' ) );

		$this->assertTrue( Product::does_site_have_feature( 'scan' ) );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * And answers a feature the site does not hold just as directly.
	 */
	public function test_wpcom_host_answers_a_missing_feature_without_a_request() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		$this->simulate_wpcom_site( array() );

		$this->assertFalse( Product::does_site_have_feature( 'scan' ) );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * The answer no longer depends on WordPress.com being reachable, which is the
	 * correctness half of this: a failed fetch used to read as "no feature".
	 */
	public function test_wpcom_host_is_unaffected_by_a_failing_request() {
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
		$this->simulate_wpcom_site( array( 'scan' ) );

		$this->assertTrue( Product::does_site_have_feature( 'scan' ) );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * A slug WordPress.com does not gate must not be answered "no" by a registry that
	 * never had it — it falls through to the site's feature list as before.
	 */
	public function test_a_feature_wpcom_does_not_gate_still_uses_the_feature_list() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		$this->simulate_wpcom_site( array( 'scan' ) );

		$this->assertTrue( Product::does_site_have_feature( 'backups' ) );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * Off WordPress.com the functions do not exist, so the feature list still answers.
	 */
	public function test_self_hosted_still_uses_the_feature_list() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );

		$this->assertTrue( Product::does_site_have_feature( 'backups' ) );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * Put the site on WordPress.com, gating the slugs this suite asks about.
	 *
	 * `scan` is gated and `backups` deliberately is not, so one simulated site covers both
	 * the answered-locally and the fall-through paths.
	 *
	 * @param string[] $entitled Feature slugs the site holds.
	 */
	private function simulate_wpcom_site( array $entitled ) {
		\Wpcom_Test_Features::$known    = array( 'scan' );
		\Wpcom_Test_Features::$entitled = $entitled;
	}
}
