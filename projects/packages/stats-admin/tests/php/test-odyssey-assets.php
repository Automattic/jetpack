<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName: This is necessary to ensure that PHPUnit runs these tests.
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;
use WP_Error;

/**
 * Unit tests for the Odyssey_Assets class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_Odyssey_Assets extends Stats_Test_Case {

	/**
	 * Test remote cache buster.
	 */
	public function test_get_cdn_asset_cache_buster() {
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) );
	}

	/**
	 * Test remote cache buster breaking.
	 */
	public function test_get_cdn_asset_cache_buster_force_refresh() {
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
		add_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15, 3 );
		$this->assertEquals( time(), floor( $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) / 1000 ) );
		remove_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15 );
	}

	/**
	 * Test already cached cache buster.
	 */
	public function test_get_cdn_asset_cache_buster_already_cached() {
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
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
		$this->assertEquals( 'calypso-4917-8664-123456', $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) );
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
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) );
	}

	/**
	 * Test already cached cache buster expired and failed to fetch new one.
	 */
	public function test_get_cdn_asset_cache_buster_failed_to_fetch() {
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
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
		$this->assertEquals( time(), floor( $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) / 1000 ) );
		remove_filter( 'pre_http_request', array( $this, 'break_cdn_cache_buster_request' ), 15 );
	}

	/**
	 * Test force refresh cache buster.
	 */
	public function test_get_cdn_asset_cache_buster_force_refresh_expired() {
		list($get_cdn_asset_cache_buster, $odyssey_assets) = $this->get_cdn_asset_cache_buster_callable();
		$_GET['force_refresh']                             = 1;
		$this->assertEquals( time(), floor( $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) / 1000 ) );
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
		return array( $get_cdn_asset_cache_buster, $odyssey_assets );
	}
}
