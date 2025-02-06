<?php
/**
 * Wpcomsh Loaded Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomshLoadedTest.
 */
class WpcomshLoadedTest extends WP_UnitTestCase {
	/**
	 * Test that it's loaded.
	 */
	public function test_loaded() {
		$this->assertTrue( defined( 'WPCOMSH_VERSION' ) );
	}

	/**
	 * Test that any composer dependencies are loaded.
	 */
	public function test_composer_dependencies_loaded() {
		$this->assertTrue( function_exists( 'automattic_podcasting_init' ), 'vendor/automattic/at-pressable-podcasting not loaded' );
		$this->assertTrue( class_exists( 'Jetpack_Fonts' ), 'vendor/automattic/custom-fonts not loaded' );
		$this->assertTrue( class_exists( 'Jetpack_Fonts_Typekit' ), 'vendor/automattic/custom-fonts-typekit not loaded' );
		$this->assertTrue( function_exists( 'wpcom_media_video_styles' ), 'vendor/automattic/text-media-widget-styles not loaded' );
	}
}
