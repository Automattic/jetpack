<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;

/**
 * Unit tests for the caching in Wpcom_Products::get_site_current_purchases().
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Wpcom_Products::get_site_current_purchases
 */
class Wpcom_Products_Purchases_Test extends TestCase {

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
		Wpcom_Products::reset_purchases_cache();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
		remove_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		remove_filter( 'pre_set_transient_' . Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, '__return_false' );
		Wpcom_Products::reset_purchases_cache();

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
	 * Answers every outbound HTTP request with a 200 carrying one purchase.
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
				array( array( 'product_slug' => 'jetpack_complete' ) ),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * The product slugs in a purchases response, narrowed the way the product classes narrow it.
	 *
	 * @param mixed $purchases The get_site_current_purchases() return value.
	 * @return string[]
	 */
	private function product_slugs( $purchases ) {
		$slugs = array();

		if ( is_array( $purchases ) ) {
			foreach ( $purchases as $purchase ) {
				$slugs[] = $purchase->product_slug;
			}
		}

		return $slugs;
	}

	/**
	 * A failed lookup answers later callers rather than firing one request per product.
	 */
	public function test_failed_lookup_is_only_attempted_once() {
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );

		$first  = Wpcom_Products::get_site_current_purchases();
		$second = Wpcom_Products::get_site_current_purchases();

		$this->assertInstanceOf( WP_Error::class, $first );
		$this->assertInstanceOf( WP_Error::class, $second );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * When the transient write does not retain — an object cache evicting under load — the
	 * in-process memo still holds a dashboard render to a single WPCOM request.
	 */
	public function test_successful_lookup_is_only_attempted_once_when_the_transient_does_not_retain() {
		add_filter( 'pre_set_transient_' . Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, '__return_false' );
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );

		$first  = Wpcom_Products::get_site_current_purchases();
		$second = Wpcom_Products::get_site_current_purchases();

		$this->assertFalse( get_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY ), 'The transient retained, so this test would pass without the memo.' );
		$this->assertSame( array( 'jetpack_complete' ), $this->product_slugs( $first ) );
		$this->assertEquals( $first, $second );
		$this->assertSame( 1, $this->http_calls );
	}

	/**
	 * A memoized lookup must not keep answering once the cache holds a newer plan, or the
	 * dashboard reports a stale purchase for the rest of the request.
	 */
	public function test_warm_transient_outranks_a_stale_memo() {
		add_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );
		$first = Wpcom_Products::get_site_current_purchases();
		remove_filter( 'pre_http_request', array( $this, 'succeed_http_request' ) );

		$this->assertSame( array( 'jetpack_complete' ), $this->product_slugs( $first ) );

		set_transient(
			Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY,
			array( (object) array( 'product_slug' => 'jetpack_security_t1' ) ),
			Wpcom_Products::MY_JETPACK_PURCHASES_CACHE_DURATION
		);

		$purchases = Wpcom_Products::get_site_current_purchases();

		$this->assertSame( array( 'jetpack_security_t1' ), $this->product_slugs( $purchases ) );
	}
}
