<?php

/**
 * Testing Activation and Deactivation of Modules
 */
class WP_Test_Jetpack_Sync_Modules extends WP_Test_Jetpack_Sync_Base {

	public function test_sync_activate_module_event() {
		// Calling the activate_module in tests is difficult.
		// Since the site need to eather be connected or in offline mode.
		// But we don't allow sync to happen in offline mode.
		do_action( 'jetpack_activate_module', 'stuff' );
		$this->sender->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_activate_module' );
		$event  = $events[0];

		$this->assertEquals( 'jetpack_activate_module', $event->action );
		$this->assertEquals( 'stuff', $event->args[0] );
	}

	public function test_sync_deactivate_module_event() {

		Jetpack_Options::update_option( 'active_modules', array( 'search' ) );
		Jetpack::deactivate_module( 'search' );

		$this->sender->do_sync();
		$events = $this->server_event_storage->get_all_events( 'jetpack_deactivate_module' );

		$event = $events[0];
		$this->assertEquals( 'jetpack_deactivate_module', $event->action );
		$this->assertEquals( 'search', $event->args[0] );
		$this->assertCount( 1, $events );
	}

}
