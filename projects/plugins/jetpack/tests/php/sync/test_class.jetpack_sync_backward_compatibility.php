<?php

/**
 * Testing Backward Compatibility with Olter plugins.
 */
class WP_Test_Jetpack_Sync_Backward_Compatibility extends WP_Test_Jetpack_Sync_Base {

	public function test_backwards_compatibility_sync_options() {
		require_once JETPACK__PLUGIN_DIR . '3rd-party/crowdsignal.php';
		$this->setExpectedDeprecated( 'Jetpack_Sync::sync_options' );
		Jetpack_Sync::sync_options( __FILE__, 'foo_option', 'bar_option' );
	}
}
