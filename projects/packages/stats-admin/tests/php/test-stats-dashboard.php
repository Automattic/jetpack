<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName: This is necessary to ensure that PHPUnit runs these tests.
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;

/**
 * Unit tests for the Dashbaord class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_Plan extends Stats_Test_Case {
	/**
	 * Test that init sets $initialized.
	 */
	public function test_init_sets_initialized() {
		Dashboard::init();
		$get_initialized           = function () {
			return static::$initialized;
		};
		$get_dashboard_initialized = $get_initialized->bindTo( null, Dashboard::class );
		$this->assertTrue( $get_dashboard_initialized() );
	}

	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard">/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Test remote cache buster.
	 */
	public function test_get_cdn_asset_cache_buster() {
		$dashboard                  = new Dashboard();
		$get_cdn_asset_cache_buster = new \ReflectionMethod( $dashboard, 'get_cdn_asset_cache_buster' );
		$get_cdn_asset_cache_buster->setAccessible( true );
		$this->assertEquals( 'calypso-4917-8664-g72a154d63a', $get_cdn_asset_cache_buster->invoke( $dashboard ) );
	}

	/**
	 * Test configData set to JS.
	 */
	public function test_render_config_data() {
		$dashboard   = new Dashboard();
		$config_data = new \ReflectionMethod( $dashboard, 'get_config_data_js' );
		$config_data->setAccessible( true );
		$this->assertMatchesRegularExpression( '/window\.configData/', $config_data->invoke( $dashboard ) );
	}

	/**
	 * Test config_data has all necessary keys.
	 */
	public function test_config_data() {
		$dashboard   = new Dashboard();
		$config_data = new \ReflectionMethod( $dashboard, 'config_data' );
		$config_data->setAccessible( true );
		$data = $config_data->invoke( $dashboard );
		$this->assertArrayHasKey( 'admin_page_base', $data );
		$this->assertArrayHasKey( 'api_root', $data );
		$this->assertArrayHasKey( 'blog_id', $data );
		$this->assertArrayHasKey( 'env_id', $data );
		$this->assertArrayHasKey( 'google_analytics_key', $data );
		$this->assertArrayHasKey( 'google_maps_and_places_api_key', $data );
		$this->assertArrayHasKey( 'i18n_default_locale_slug', $data );
		$this->assertArrayHasKey( 'nonce', $data );
		$this->assertArrayHasKey( 'site_name', $data );
		$this->assertArrayHasKey( 'intial_state', $data );
		$this->assertEmpty( $data->features );
	}
}
