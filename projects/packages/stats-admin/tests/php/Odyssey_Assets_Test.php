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
				)
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
				)
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
				)
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
		$get_cdn_asset_cache_buster->setAccessible( true );

		return $get_cdn_asset_cache_buster->invoke( $odyssey_assets );
	}
}
