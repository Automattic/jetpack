<?php


/**
 * Testing CRUD on Users
 */
class WP_Test_Jetpack_Sync_Users extends WP_Test_Jetpack_Sync_Base {
	protected $user_id;

	public function setUp() {
		parent::setUp();

		// create a user
		$this->user_id = $this->factory->user->create();
		$this->sender->do_sync();
	}

	public function test_insert_user_is_synced() {
		$user        = get_user_by( 'id', $this->user_id );
		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		// make sure that we don't have a password
		unset( $user->data->user_pass );
		$this->assertFalse( isset( $server_user->data->user_pass ) );

		// The regular user object doesn't have allowed_mime_types
		unset( $server_user->data->allowed_mime_types );

		$this->assertEqualsObject( $user, $server_user );
	}

	public function test_update_user_url_is_synced() {
		$new_url = 'http://jetpack.com';

		wp_update_user( array(
			'ID'       => $this->user_id,
			'user_url' => $new_url
		) );

		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$this->assertEquals( $new_url, $server_user->data->user_url );
	}

	public function test_update_user_password_is_not_synced() {
		$this->server_event_storage->reset();
		$new_password = 'New PassWord';

		wp_update_user( array(
			'ID'        => $this->user_id,
			'user_pass' => $new_password
		) );
		$this->sender->do_sync();

		// Don't sync the password changes since we don't track passwords
		$events = $this->server_event_storage->get_all_events();
		$this->assertEmpty( $events );
	}

	public function test_delete_user_is_synced() {
		$user = get_user_by( 'id', $this->user_id );

		$this->sender->do_sync();

		// make sure user exists in replica
		$this->assertUsersEqual( $user, $this->server_replica_storage->get_user( $this->user_id ) );

		wp_delete_user( $this->user_id );

		$this->sender->do_sync();
		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_user( $this->user_id ) );
	}

	public function test_delete_user_reassign_is_synced() {
		$reassign = $this->factory->user->create();
		wp_delete_user( $this->user_id, $reassign );
		$this->sender->do_sync();
		// $this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'deleted_user' );
		$this->assertEquals( 'deleted_user', $event->action );
		$this->assertEquals( $this->user_id, $event->args[0] );
		$this->assertEquals( $reassign, $event->args[1] );
	}
	
	// User meta not syncing 
	public function test_do_not_sync_user_data_on_user_meta_change() {
		$this->server_event_storage->reset();
		
		add_user_meta( $this->user_id, 'session_tokens', 'world', 1 );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();
		$this->assertFalse( $event );

		update_user_meta( $this->user_id, 'session_tokens', 'moon' );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();
		$this->assertFalse( $event );

		delete_user_meta( $this->user_id, 'session_tokens', 'moon' );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event();
		$this->assertFalse( $event );

	}

	// Roles syncing

	public function test_user_add_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_role( 'author' );

		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_user_set_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->set_role( 'author' );

		$this->sender->do_sync();
		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_user_remove_role_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_role( 'author' );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );

		// lets now remove role
		$user->remove_role( 'author' );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	// Capabilities syncing
	public function test_user_add_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );

		// lets now remove role
		$user->remove_role( 'author' );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_user_update_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );

		// lets update the capability
		$user->add_cap( 'do_stuff', false );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_user_remove_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );

		// lets update the capability
		$user->remove_cap( 'do_stuff' );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );

		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );
		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_user_remove_all_capability_is_synced() {
		$user = get_user_by( 'id', $this->user_id );
		$user->add_cap( 'do_stuff', true );
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );

		$this->assertUsersEqual( $client_user, $server_user );

		// lets update the capability
		$user->remove_all_caps();
		$this->sender->do_sync();

		$server_user = $this->server_replica_storage->get_user( $this->user_id );
		$client_user = get_user_by( 'id', $this->user_id );
		unset( $client_user->data->user_pass );

		$this->assertUsersEqual( $client_user, $server_user );
	}

	public function test_sync_allowed_file_type() {
		$server_user_file_mime_types = $this->server_replica_storage->get_allowed_mime_types( $this->user_id );
		$this->assertEquals( get_allowed_mime_types( $this->user_id ), $server_user_file_mime_types );
	}

	// to test run phpunit -c tests/php.multisite.xml --filter test_does_not_sync_non_site_users_in_multisite
	public function test_deletes_users_removed_from_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$original_blog_id = get_current_blog_id();

		// NOTE this is necessary because WPMU causes certain assumptions about transients
		// to be wrong, and tests to explode. @see: https://github.com/sheabunge/WordPress/commit/ff4f1bb17095c6af8a0f35ac304f79074f3c3ff6
		global $wpdb;

		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', "My Blog", $this->user_id );
		$wpdb->suppress_errors( $suppress );

		$other_blog_user_id = $this->factory->user->create();
		add_user_to_blog( $other_blog_id, $other_blog_user_id, 'administrator' );
		remove_user_from_blog( $other_blog_user_id, $original_blog_id );

		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_user( $other_blog_user_id ) );
	}

	public function test_syncs_users_added_to_multisite() {
		global $wpdb;

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$original_blog_id = get_current_blog_id();

		// create a different blog
		$suppress      = $wpdb->suppress_errors();
		$other_blog_id = wpmu_create_blog( 'foo.com', '', "My Blog", $this->user_id );
		$wpdb->suppress_errors( $suppress );

		// create a user from within that blog (won't be synced)
		switch_to_blog( $other_blog_id );
		$mu_blog_user_id = $this->factory->user->create();
		restore_current_blog();

		$this->sender->do_sync();

		$this->assertNull( $this->server_replica_storage->get_user( $mu_blog_user_id ) );

		add_user_to_blog( $original_blog_id, $mu_blog_user_id, 'administrator' );

		$this->sender->do_sync();

		$this->assertNotNull( $this->server_replica_storage->get_user( $mu_blog_user_id ) );
	}

	public function test_syncs_user_authentication_attempts() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'foobar' ) );

		// TODO: ideally we would do wp_signon to trigger this event, but it tries to send headers and
		// causes an error.

		// wp_set_password( 'pw', $user_id );
		// $result = wp_signon( array( 'user_login' => 'foobar', 'user_password' => 'pw', 'remember' => false ) );
		// error_log(print_r($result, 1));

		do_action( 'wp_login', 'foobar', get_user_by( 'ID', $user_id ) );

		$this->sender->do_sync();

		$event                    = $this->server_event_storage->get_most_recent_event( 'wp_login' );
		$user_data_sent_to_server = $event->args[1];
		$this->assertEquals( 'foobar', $event->args[0] );
		$this->assertEquals( $user_id, $user_data_sent_to_server->ID );
		$this->assertFalse( isset( $user_data_sent_to_server->data->user_pass ) );

		do_action( 'wp_login_failed', 'foobar' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_login_failed' );
		$this->assertEquals( 'foobar', $event->args[0] );
	}

	public function test_syncs_user_logout_event() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'foobar' ) );

		// TODO: ideally we would do wp_logout to trigger this event, but it tries to send headers and
		// causes an error.

		// wp_set_password( 'pw', $user_id );
		// $user = wp_authenticate( 'foobar', 'pw' );
		// $this->assertFalse( is_wp_error( $user ) );
		// wp_logout();

		wp_set_current_user( $user_id );
		do_action( 'wp_logout' );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_logout' );
		$this->assertEquals( 'foobar', $event->args[0] );
		$user_data_sent_to_server = $event->args[1];
		$this->assertEquals( 'foobar', $user_data_sent_to_server->data->user_login );
		$this->assertFalse( isset( $user_data_sent_to_server->data->user_pass ) );
	}

	public function test_deleted_user_during_sync_doesnt_cause_error() {
		$this->server_event_storage->reset();

		do_action( 'jetpack_sync_save_user', null );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_user' );

		$this->assertFalse( $event );
	}

	public function test_maybe_demote_master_user_method() {
		// set up
		$current_master_id = $this->factory->user->create( array( 'user_login' => 'current_master' ) );
		$new_master_id     = $this->factory->user->create( array( 'user_login' => 'new_master' ) );

		$current_master = get_user_by( 'id', $current_master_id );
		$current_master->set_role( 'author' );

		$new_master = get_user_by( 'id', $new_master_id );
		$new_master->set_role( 'administrator' );
		Jetpack_Options::update_option( 'master_user', $current_master_id );
		Jetpack_Options::update_option( 'user_tokens', array(
			$current_master_id => 'apple.a.' . $current_master_id,
			$new_master_id     => 'kiwi.a.' . $new_master_id
		) );

		// maybe
		Jetpack_Sync_Users::maybe_demote_master_user( $current_master_id );
		$this->assertEquals( $new_master_id, Jetpack_Options::get_option( 'master_user' ) );

		// don't demote user that if the user is still an admin.
		Jetpack_Sync_Users::maybe_demote_master_user( $new_master_id );
		$this->assertEquals( 'administrator', $new_master->roles[0] );
		$this->assertEquals( $new_master_id, Jetpack_Options::get_option( 'master_user' ), 'Do not demote the master user if the user is still an admin' );

		$new_master->set_role( 'author' );
		// don't demote user if the user one the only admin that is connected.
		Jetpack_Sync_Users::maybe_demote_master_user( $new_master_id );
		$this->assertEquals( $new_master_id, Jetpack_Options::get_option( 'master_user' ), 'Do not demote user if the user is the only connected user.' );
	}

	public function test_returns_user_object_by_id() {
		$user_sync_module = Jetpack_Sync_Modules::get_module( "users" );

		// get the synced object
		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_save_user' );
		$synced_user = $event->args[0];

		// grab the codec - we need to simulate the stripping of types that comes with encoding/decoding
		$codec = $this->sender->get_codec();

		$retrieved_user = $codec->decode( $codec->encode(
			$user_sync_module->get_object_by_id( 'user', $this->user_id )
		) );

		// TODO: this is to address a testing bug, alas :/
		unset( $retrieved_user->data->allowed_mime_types );

		$this->assertEquals( $synced_user, $retrieved_user );
	}

	protected function assertUsersEqual( $user1, $user2 ) {
		// order-independent comparison
		$user1_array = get_object_vars( $user1->data );
		$user2_array = get_object_vars( $user2->data );

		// we don't compare passwords because we don't sync them!
		unset( $user1_array['user_pass'] );
		unset( $user2_array['user_pass'] );

		$this->assertTrue( array_diff( $user1_array, $user2_array ) == array_diff( $user2_array, $user1_array ) );
	}

}
