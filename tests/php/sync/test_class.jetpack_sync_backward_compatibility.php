<?php

/**
 * Testing Backward Compatibility with Olter plugins.
 */
class WP_Test_Jetpack_Sync_Backward_Compatibility extends WP_Test_Jetpack_New_Sync_Base {

	public function setUp() {
		parent::setUp();
	}

	public function test_backwards_compatibility_sync_options() {
		require_once( JETPACK__PLUGIN_DIR . '3rd-party/polldaddy.php' );
		$this->setExpectedDeprecated( 'Jetpack_Sync::sync_options' );
		Jetpack_Sync::sync_options( __FILE__, 'foo_option', 'bar_option' );

		update_option( 'foo_option', '123' );
		update_option( 'bar_option', '456' );

		$this->client->do_sync();

		$this->assertEquals( '123', $this->server_replica_storage->get_option( 'foo_option' ) );
		$this->assertEquals( '456', $this->server_replica_storage->get_option( 'bar_option' ) );
	}

}
