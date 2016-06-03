<?php
require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-client.php';

/**
 * Testing CRUD on Posts
 */
class WP_Test_Jetpack_Sync_Modules extends WP_Test_Jetpack_New_Sync_Base {

	public function setUp() {
		parent::setUp();
	}

	function test_sync_modules_callable() {
		$this->client->do_sync();
		// we want to be able to reproduce the get modules endpoint from .com
		$this->assertTrue( ! empty( $this->server_replica_storage->get_callable( 'modules' ) ) );
	}


	function test_sync_activate_module_event() {
		// calling the activate_module in tests is a bit
		do_action( 'jetpack_activate_module', 'stuff' );
		$this->client->do_sync();

		$events = $this->server_event_storage->get_all_events( 'jetpack_activate_module' );
		$event = $events[0];
		$this->assertEquals( 'jetpack_activate_module', $event->action );
		$this->assertEquals( 'stuff', $event->args[0] );

	}


	function test_sync_deactivate_module_event() {
		Jetpack_Options::update_option( 'active_modules', array( 'stuff' ) );
		Jetpack::deactivate_module( 'stuff' );

		$this->client->do_sync();
		$events = $this->server_event_storage->get_all_events( 'jetpack_deactivate_module' );

		$event = $events[0];
		$this->assertEquals( 'jetpack_deactivate_module', $event->action );
		$this->assertEquals( 'stuff', $event->args[0] );
		$this->assertEquals( 1, count( $events ) );

	}
}
