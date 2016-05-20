<?php


/**
 * Testing CRUD on Users
 */
class WP_Test_Jetpack_New_Sync_Users extends WP_Test_Jetpack_New_Sync_Base {
	protected $user_id;

	public function setUp() {
		parent::setUp();
		$this->client->set_defaults();
		$this->client->reset_data();

		// create a user
		$this->user_id = $this->factory->user->create();
		$this->client->do_sync();
	}

	public function test_insert_user_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		// make sure that we don't have a password
		unset( $user->data->user_pass );
		$this->assertFalse(  isset( $server_user->data->user_pass ) );
		$this->assertEquals( $user, $server_user );
	}

	public function test_update_user_url_is_synced() {
		$new_url = 'http://jetpack.com';

		wp_update_user( array(
			'ID' => $this->user_id,
			'user_url' => $new_url
		) );

		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$this->assertEquals( $new_url, $server_user->data->user_url );
	}

	public function test_update_user_password_is_not_synced() {
		$this->server_event_storage->reset();
		$new_password = 'New PassWord';

		wp_update_user( array(
			'ID' => $this->user_id,
			'user_pass' => $new_password
		) );
		$this->client->do_sync();

		// Don't sync the password changes since we don't track password
		$events = $this->server_event_storage->get_all_events();
		$this->assertEmpty( $events );
	}

	public function test_delete_user_is_synced() {
		wp_delete_user( $this->user_id );
		$this->client->do_sync();
		$user = get_user_by( 'id', $this->user_id );
		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		if ( is_multisite() ) {
			$this->assertEquals( false, $server_user );
		} else {
			$this->assertEquals( $user, $server_user );
		}
	}

	public function test_delete_user_reassign_is_synced() {
		$reassign = $this->factory->user->create();
		wp_delete_user( $this->user_id, $reassign );
		$this->client->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'deleted_user' );
		$this->assertEquals( 'deleted_user', $event->action );
		$this->assertEquals( $this->user_id, $event->args[0] );
		$this->assertEquals( $reassign, $event->args[1] );
	}

	// Roles syncing

	public function test_user_add_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_role( 'author' );

		$this->client->do_sync();
		
		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	public function test_user_set_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->set_role( 'author' );

		$this->client->do_sync();
		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	public function test_user_remove_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_role( 'author' );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

		// lets now remove role
		$user->remove_role( 'author' );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	// Capabilities syncing
	public function test_user_add_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

		// lets now remove role
		$user->remove_role( 'author' );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	public function test_user_update_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

		// lets update the capability
		$user->add_cap( 'do_stuff', false );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	public function test_user_remove_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

		// lets update the capability
		$user->remove_cap( 'do_stuff' );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );
	}

	public function test_user_remove_all_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

		// lets update the capability
		$user->remove_all_caps();
		$this->client->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertEquals( $client_user, $server_user );

	}
}
