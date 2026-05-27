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
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that it's loaded.
	 */
	public function test_loaded() {
		$this->assertTrue( defined( 'WPCOMSH_VERSION' ) );
	}

	/**
	 * Test that any composer dependencies are loaded.
	 *
	 * The legacy at-pressable-podcasting vendor is intentionally gated by
	 * `jetpack_podcast_untangle` and no longer loads when the gate is on
	 * (which is now the default). The vendor still ships in vendor/ until
	 * the Phase D cleanup; only the boot path is gated.
	 */
	public function test_composer_dependencies_loaded() {
		$this->assertTrue( class_exists( 'Jetpack_Fonts' ), 'vendor/automattic/custom-fonts not loaded' );
		$this->assertTrue( class_exists( 'Jetpack_Fonts_Typekit' ), 'vendor/automattic/custom-fonts-typekit not loaded' );
		$this->assertTrue( function_exists( 'wpcom_media_video_styles' ), 'vendor/automattic/text-media-widget-styles not loaded' );
	}
}
