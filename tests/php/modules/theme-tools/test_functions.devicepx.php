<?php

require_once JETPACK__PLUGIN_DIR . '/modules/theme-tools/devicepx.php';

/**
 * @covers jetpack_devicepx_init
 */
function test_devicepx_not_enqueued_by_default() {
	$this->assertFalse( current_theme_supports( 'jetpack-devicepx' ) );
}

/**
 * @covers jetpack_devicepx_init
 */
function test_devicepx_can_be_enabled() {
	// Enable the feature.
	add_theme_supports( 'jetpack-devicepx' );

	$this->assertTrue(
		current_theme_supports( 'jetpack-devicepx' ),
		'Themes do not support devicepx by default'
	);

	jetpack_devicepx_init();

	$this->assertTrue(
		wp_script_is( 'jetpack-devicepx', 'enqueued' ),
		'devicepx script has been enquued'
	);

	// Remove to not mess with other tests.
	remove_theme_supports( 'jetpack-devicepx' );
}
