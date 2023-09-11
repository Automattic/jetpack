<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName: This is necessary to ensure that PHPUnit runs these tests.
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;

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
		$odyssey_assets             = new Odyssey_Assets();
		$get_cdn_asset_cache_buster = new \ReflectionMethod( $odyssey_assets, 'get_cdn_asset_cache_buster' );
		$get_cdn_asset_cache_buster->setAccessible( true );
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $get_cdn_asset_cache_buster->invoke( $odyssey_assets ) );
	}
}
