<?php

/**
 * Testing Updates Sync
 */
class WP_Test_Jetpack_New_Sync_Updates extends WP_Test_Jetpack_New_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->client->set_defaults();
		$this->client->reset_data();
		wp_set_current_user( 1 );
		$this->client->do_sync();
	}

	public function test_update_plugins_is_synced() {
		$this->assertNull( $this->server_replica_storage->get_updates( 'plugins' ) );
		wp_update_plugins();
		$this->client->do_sync();
		$this->assertTrue( is_array( $this->server_replica_storage->get_updates( 'plugins' ) ) );
	}

	public function test_update_plugins_syncs_response_data() {
		$this->assertNull( $this->server_replica_storage->get_updates( 'plugins' ) );

		// some fake update data
		$update_data = (object) array( 'response' => array( 'foo' ) );
		set_site_transient( 'update_plugins', $update_data );

		$this->client->do_sync();
		$this->assertEquals( array( 'foo' ), $this->server_replica_storage->get_updates( 'plugins' ) );
	}

	public function test_sync_update_themes() {
		wp_update_themes();
		$this->client->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'themes' );
		$this->assertTrue( is_array( $updates ) );
	}

	public function test_sync_maybe_update_core() {
		_maybe_update_core();
		$this->client->do_sync();
		$updates = $this->server_replica_storage->get_updates( 'core' );
		$this->assertTrue( is_array( $updates ) );
	}

	public function test_sync_wp_version() {
		$this->assertEquals( null, $this->server_replica_storage->get_wp_version() );

		do_action( 'upgrader_process_complete', null, array( 'action' => 'update', 'type' => 'core' ) );

		$this->client->do_sync();

		global $wp_version;
		$this->assertEquals( $wp_version, $this->server_replica_storage->get_wp_version() );
	}

}