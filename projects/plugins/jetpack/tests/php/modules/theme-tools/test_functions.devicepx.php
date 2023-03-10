<?php

require_once JETPACK__PLUGIN_DIR . '/modules/theme-tools/devicepx.php';

class WP_Test_Jetpack_Theme_Tools_Devicepx extends WP_UnitTestCase {

	/**
	 * @covers ::jetpack_devicepx_init
	 */
	public function test_devicepx_not_enqueued_by_default() {
		$this->assertFalse( current_theme_supports( 'jetpack-devicepx' ) );
	}

	/**
	 * @covers ::jetpack_devicepx_init
	 */
	public function test_devicepx_can_be_enabled() {
		// Enable the feature.
		add_theme_support( 'jetpack-devicepx' );

		$this->assertTrue(
			current_theme_supports( 'jetpack-devicepx' ),
			'Support for devicepx has been enabled'
		);

		$this->assertFalse(
			has_action( 'wp_enqueue_scripts', 'jetpack_devicepx_enqueue' ),
			'devicepx is not enqueued until jetpack_devicepx_init() is called'
		);

		jetpack_devicepx_init();

		$this->assertEquals(
			10,
			has_action( 'wp_enqueue_scripts', 'jetpack_devicepx_enqueue' ),
			'devicepx script has been enqueued'
		);

		// Remove to not mess with other tests.
		remove_theme_support( 'jetpack-devicepx' );
	}

}
