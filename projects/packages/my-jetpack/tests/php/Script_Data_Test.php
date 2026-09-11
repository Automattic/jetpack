<?php
/**
 * Tests for My Jetpack script data.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

/**
 * Tests the My Jetpack addition to the unified script data object.
 */
class Script_Data_Test extends BaseTestCase {

	/**
	 * Site Editor data is added without replacing existing script data.
	 */
	public function test_adds_site_editor_data() {
		$data = Initializer::add_script_data( array( 'existing' => 'value' ) );

		$this->assertSame( 'value', $data['existing'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isBlockTheme'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isSharingBlockAvailable'] );
		$this->assertSame( get_stylesheet(), $data['myJetpack']['siteEditor']['activeThemeStylesheet'] );
	}

	/**
	 * The base has to address the package's own built images, and to match the value the
	 * My Jetpack page localizes, so `assetUrl()` resolves the same URL either way.
	 */
	public function test_adds_the_image_base_url() {
		$data = Initializer::add_assets_script_data( array( 'existing' => 'value' ) );

		$this->assertSame( 'value', $data['existing'] );
		$this->assertStringEndsWith( '/my-jetpack/build/images/', $data['myJetpack']['assetsUrl'] );
		$this->assertSame( Initializer::get_assets_url(), $data['myJetpack']['assetsUrl'] );
	}

	/**
	 * The Jetpack plugin renders this package's connection screen on its own page, where
	 * `myJetpackInitialState` is never localized.
	 */
	public function test_the_image_base_url_is_registered_off_the_my_jetpack_page() {
		Initializer::init();

		$this->assertSame( 0, did_action( 'admin_enqueue_scripts' ) );
		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', array( Initializer::class, 'add_assets_script_data' ) )
		);
	}
}
