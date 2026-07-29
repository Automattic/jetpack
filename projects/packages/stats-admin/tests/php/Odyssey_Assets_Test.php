<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use WP_Error;

/**
 * Unit tests for the Odyssey_Assets class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Odyssey_Assets_Test extends Stats_TestCase {

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		$this->reset_wp_styles();
		parent::tearDown();
	}

	/**
	 * Odyssey's stylesheet must declare `wp-components` as a dependency rather than relying on
	 * another admin feature (e.g. WP 7.0's command palette) enqueuing it as a side effect.
	 * Asserted as a registered dependency, not just "is enqueued", because the dependency edge is
	 * what also guarantees WP emits wp-components *before* Odyssey's own overrides of its classes.
	 *
	 * Only the CDN branch is exercised. The local-dev branch declares the same
	 * `self::CSS_DEPENDENCIES` constant, but reaching it needs a `dist/` build that exists only on a
	 * developer's own machine -- never in CI or in a release -- and a regression there surfaces
	 * immediately as unstyled components.
	 */
	public function test_odyssey_style_declares_wp_components_dependency() {
		$this->reset_wp_styles();
		wp_register_style( 'wp-components', false );
		$this->assertFalse( wp_style_is( 'wp-components', 'enqueued' ) );

		// An asset name with no dist/ file forces the CDN branch regardless of what's on disk.
		( new Odyssey_Assets() )->load_admin_scripts( 'jp-stats-dashboard', 'nonexistent-test-build' );

		// The CDN branch registers the stylesheet under "{$asset_handle}-style", not $asset_handle
		// itself -- that bare handle is reserved for the script.
		$registered = wp_styles()->query( 'jp-stats-dashboard-style', 'registered' );
		$this->assertNotFalse( $registered, 'Odyssey should register a stylesheet handle.' );
		$this->assertContains( 'wp-components', $registered->deps );
		$this->assertTrue( wp_style_is( 'wp-components', 'enqueued' ) );
	}

	/**
	 * Test remote cache buster.
	 */
	public function test_get_cdn_asset_cache_buster() {
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $this->get_cdn_asset_cache_buster_callable() );
	}

	/**
	 * Test remote cache buster remote error.
	 */
	public function test_get_cdn_asset_cache_buster_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15, 3 );
		$this->assertLessThanOrEqual( 2, time() - floor( $this->get_cdn_asset_cache_buster_callable() / 1000 ) );
		remove_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15 );
	}

	/**
	 * Test already cached cache buster.
	 */
	public function test_get_cdn_asset_cache_buster_already_cached() {
		update_option(
			Odyssey_Assets::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY,
			wp_json_encode(
				array(
					'cache_buster' => 'calypso-4917-8664-123456',
					'cached_at'    => floor( microtime( true ) * 1000 ), // milliseconds.
				),
				JSON_UNESCAPED_SLASHES
			),
			false
		);
		$this->assertEquals( 'calypso-4917-8664-123456', $this->get_cdn_asset_cache_buster_callable() );
	}

	/**
	 * Test already cached cache buster expired.
	 */
	public function test_get_cdn_asset_cache_buster_already_cached_expired() {
		update_option(
			Odyssey_Assets::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY,
			wp_json_encode(
				array(
					'cache_buster' => 'calypso-4917-8664-123456',
					'cached_at'    => floor( microtime( true ) * 1000 - MINUTE_IN_SECONDS * 1000 * 20 ), // milliseconds.
				),
				JSON_UNESCAPED_SLASHES
			),
			false
		);
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $this->get_cdn_asset_cache_buster_callable() );
	}

	/**
	 * Test already cached cache buster expired and failed to fetch new one.
	 */
	public function test_get_cdn_asset_cache_buster_failed_to_fetch() {
		add_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15, 3 );
		update_option(
			Odyssey_Assets::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY,
			wp_json_encode(
				array(
					'cache_buster' => 'calypso-4917-8664-123456',
					'cached_at'    => floor( microtime( true ) * 1000 - MINUTE_IN_SECONDS * 1000 * 20 ), // milliseconds.
				),
				JSON_UNESCAPED_SLASHES
			),
			false
		);
		$this->assertLessThanOrEqual( 2, time() - floor( $this->get_cdn_asset_cache_buster_callable() / 1000 ) );
		remove_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15 );
	}

	/**
	 * Test force refresh cache buster.
	 */
	public function test_get_cdn_asset_cache_buster_force_refresh_expired() {
		$_GET['force_refresh'] = 1;
		$this->assertLessThanOrEqual( 2, time() - floor( $this->get_cdn_asset_cache_buster_callable() / 1000 ) );
	}

	/**
	 * Test remote cache buster.
	 *
	 * @param mixed $response  The response array.
	 * @param mixed $parsed_args  The parsed args.
	 * @param mixed $url  The URL.
	 * @return WP_Error | void
	 */
	public function break_cdn_cache_buster_request( $response, $parsed_args, $url ) {
		if ( strpos( $url, '/build_meta.json' ) !== false ) {
			return new WP_Error( 500, 'Internal Server Error' );
		}
	}

	/**
	 * Get CDN asset cache buster.
	 */
	protected function get_cdn_asset_cache_buster_callable() {
		$odyssey_assets             = new Odyssey_Assets();
		$get_cdn_asset_cache_buster = new \ReflectionMethod( $odyssey_assets, 'get_cdn_asset_cache_buster' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$get_cdn_asset_cache_buster->setAccessible( true );
		}

		return $get_cdn_asset_cache_buster->invoke( $odyssey_assets );
	}

	/**
	 * Style handles live in process-global state (`$GLOBALS['wp_styles']`) that persists across
	 * tests within a run -- WorDBless resets options/posts/users in TestCase::setUp(), but not
	 * this -- so they leak in both directions and this runs at both ends of the style test.
	 * Dequeuing/deregistering the specific handles rather than replacing the whole `WP_Styles`
	 * object, since a fresh `new \WP_Styles()` reruns its constructor's `wp_default_styles` hook,
	 * which needs more of the request environment set up than this test bootstrap provides.
	 */
	protected function reset_wp_styles() {
		foreach ( array( 'wp-components', 'jp-stats-dashboard', 'jp-stats-dashboard-style' ) as $handle ) {
			wp_dequeue_style( $handle );
			wp_deregister_style( $handle );
		}
	}
}
