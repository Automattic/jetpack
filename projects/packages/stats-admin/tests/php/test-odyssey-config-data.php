<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName: This is necessary to ensure that PHPUnit runs these tests.
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;

/**
 * Unit tests for the Odyssey_Config_Data class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_Odyssey_Config_Data extends Stats_Test_Case {
	/**
	 * Test configData set to JS.
	 */
	public function test_render_config_data() {
		$config_data = new Odyssey_Config_Data();
		$this->assertTrue( strpos( $config_data->get_js_config_data(), 'window.configData' ) === 0 );
	}

	/**
	 * Test configData set to JS.
	 */
	public function test_render_config_data_with_param() {
		$config_data = new Odyssey_Config_Data();
		$this->assertTrue( strpos( $config_data->get_js_config_data( 'configData', array( 'testtesttest' ) ), 'window.configData' ) === 0 );
		$this->assertTrue( strpos( $config_data->get_js_config_data( 'configData', array( 'testtesttest' ) ), 'testtesttest' ) > 0 );
	}

	/**
	 * Test config_data has all necessary keys.
	 */
	public function test_config_data() {
		$config_data = new Odyssey_Config_Data();
		$data        = $config_data->get_data();
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
		$this->assertArrayHasKey( 'is_running_in_jetpack_site', $data['features'] );
	}
}
