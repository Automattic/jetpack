<?php

/**
 * Testing Updates Sync
 */
class WP_Test_Jetpack_Sync_Updates extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->sender->reset_data();
		wp_set_current_user( 1 );
		$this->sender->do_sync();
	}

	public function test_update_plugins_is_synced() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_plugins();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'plugins' );

		$this->assertFalse( isset( $updates->no_update ) );
		$this->assertTrue( isset( $updates->response ) );

		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_sync_update_themes() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		wp_update_themes();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_sync_maybe_update_core() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not compatible with multisite mode' );
		}

		_maybe_update_core();
		$this->sender->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( is_int( $updates->last_checked ) );
	}

	public function test_sync_wp_version() {
		global $wp_version;
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );

		// Lets pretend that we updated the wp_version to bar.
		$wp_version = 'bar';
		do_action( 'upgrader_process_complete', null, array( 'action' => 'update', 'type' => 'core' ) );
		$this->sender->do_sync();
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_callable( 'wp_version' ) );
	}

	public function test_automatic_updates_complete_sync_action() {
		// wp_maybe_auto_update();
		do_action( 'automatic_updates_complete', array( 'core' => array(
			'item'     => array('somedata'),
			'result'   => 'some more data',
			'name'     => 'WordPress 4.7',
			'messages' => array('it worked.') ) ) );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'automatic_updates_complete' );
		$this->assertTrue( (bool) $event );
	}

}
