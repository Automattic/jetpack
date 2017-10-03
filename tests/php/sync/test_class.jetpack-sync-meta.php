<?php

/**
 * Testing CRUD on Meta
 */
class WP_Test_Jetpack_Sync_Meta extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $user_id;
	protected $meta_module;

	protected $whitelisted_post_meta = 'foobar';
	protected $whitelisted_user_meta = 'foobar';


	public function setUp() {
		parent::setUp();

		// create a post
		$this->meta_module = Jetpack_Sync_Modules::get_module( "meta" );
		Jetpack_Sync_Settings::update_settings( array( 'post_meta_whitelist' => array( 'foobar' ) ) );
		$this->post_id = $this->factory->post->create();
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );

		$this->user_id = $this->factory->user->create();
		Jetpack_Sync_Settings::update_settings( array( 'user_meta_whitelist' => array( 'foobar' ) ) );
		add_user_meta( $this->user_id , $this->whitelisted_user_meta, 'foo' );
		$this->sender->do_sync();
	}

	public function test_added_post_meta_is_synced() {

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );

		$this->assertEquals( 'foo', $meta_key_value );
		$this->assertEquals( array( 'foo' ), $meta_key_array );
	}

	public function test_added_multiple_post_meta_is_synced() {

		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo', true );
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		update_post_meta( $this->post_id, $this->whitelisted_post_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );

		delete_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );

		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta, true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {

		add_post_meta( $this->post_id, $this->whitelisted_post_meta, 'foo' );

		delete_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, '', true );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, $this->whitelisted_post_meta );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta, true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, $this->whitelisted_post_meta ), $meta_key_array );
	}

	public function test_doesn_t_sync_private_meta() {
		add_post_meta( $this->post_id, '_private_meta', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_post_meta_whitelist_cab_be_appened_in_settings() {
		add_post_meta( $this->post_id, '_private_meta', 'foo' );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );

		Jetpack_Sync_Settings::update_settings( array( 'post_meta_whitelist' => array( '_private_meta' ) ) );
		
		add_post_meta( $this->post_id, '_private_meta', 'boo' );
		
		$this->sender->do_sync();

		$this->assertEquals( 'boo', $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_comment_meta_whitelist_cab_be_appened_in_settings() {
		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );
		
		add_comment_meta( $comment_ids[0], '_private_meta', 'foo' );
		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'comment', $comment_ids[0], '_private_meta', true ) );

		Jetpack_Sync_Settings::update_settings( array( 'comment_meta_whitelist' => array( '_private_meta' ) ) );

		add_comment_meta( $comment_ids[0], '_private_meta', 'boo' );
		$this->sender->do_sync();

		$this->assertEquals( 'boo', $this->server_replica_storage->get_metadata( 'comment', $comment_ids[0], '_private_meta', true ) );
	}

	public function test_sync_whitelisted_post_meta() {
		Jetpack_Sync_Settings::update_settings( array( 'post_meta_whitelist' => array() ) );
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_post_meta = Jetpack_Sync_Defaults::$post_meta_whitelist;

		// update all the opyions.
		foreach ( $white_listed_post_meta as $meta_key ) {
			add_post_meta( $this->post_id, $meta_key, 'foo' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_post_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'post', $this->post_id );
		}
		$whitelist = Jetpack_Sync_Settings::get_setting( 'post_meta_whitelist' );

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_post_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_sync_whitelisted_comment_meta() {
		Jetpack_Sync_Settings::update_settings( array( 'comment_meta_whitelist' => array() ) );
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_comment_meta = Jetpack_Sync_Defaults::$comment_meta_whitelist;

		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );

		// update all the comment meta
		foreach ( $white_listed_comment_meta as $meta_key ) {
			add_comment_meta( $comment_ids[0], $meta_key, 'foo', 'comment' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_comment_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'comment', $comment_ids[0] );
		}
		$whitelist = Jetpack_Sync_Settings::get_setting( 'comment_meta_whitelist' );

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_comment_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_syncs_wpas_skip_meta() {
		$this->setSyncClientDefaults();
		add_post_meta( $this->post_id, '_wpas_skip_1234', '1' );
		$this->sender->do_sync();

		$this->assertOptionIsSynced( '_wpas_skip_1234', '1', 'post', $this->post_id );
	}

	public function test_added_user_meta_is_synced() {

		$meta_key_value = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );

		$this->assertEquals( 'foo', $meta_key_value );
		$this->assertEquals( array( 'foo' ), $meta_key_array );
	}

	public function test_added_multiple_user_meta_is_synced() {

		add_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo', true );
		add_user_meta( $this->user_id, $this->whitelisted_user_meta, 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );
		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_user_meta_is_synced() {
		add_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo' );
		update_user_meta( $this->user_id, $this->whitelisted_user_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );
		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta ), $meta_key_array );
	}

	public function test_updated_user_meta_is_synced() {
		update_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo' );
		update_user_meta( $this->user_id, $this->whitelisted_user_meta, 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );
		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta ), $meta_key_array );
	}

	public function test_deleted_user_meta_is_synced() {
		add_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo' );

		delete_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );

		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta, true ), $meta_key_value );
		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta ), $meta_key_array );
	}

	public function test_delete_all_user_meta_is_synced() {

		add_user_meta( $this->user_id, $this->whitelisted_user_meta, 'foo' );

		delete_metadata( 'user', $this->user_id, $this->whitelisted_user_meta, '', true );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta, true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'user', $this->user_id, $this->whitelisted_user_meta );
		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta, true ), $meta_key_value );
		$this->assertEquals( get_user_meta( $this->user_id, $this->whitelisted_user_meta ), $meta_key_array );
	}

	public function test_syncing_user_locale_is_synced() {
		update_user_meta( $this->user_id, 'locale', 'en_GB' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'user', $this->user_id, 'locale', true );
		$this->assertEquals( get_user_meta( $this->user_id, 'locale', true ), $meta_key_value );
	}

	public function test_sync_user_capabilities_is_synced() {
		$this->server_event_storage->reset();
		$user = new WP_User( $this->user_id );
		$user->add_cap( 'can_do_foo' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'updated_user_meta' );
		$this->assertEquals( $user->caps, $event->args[3] );
	}

	public function test_sync_user_roles_is_synced() {
		$this->server_event_storage->reset();
		$user = new WP_User( $this->user_id );
		$user->add_role('foo_magic' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'updated_user_meta' );
		$this->assertEquals( $user->caps, $event->args[3] );
	}

	function assertOptionIsSynced( $meta_key, $value, $type, $object_id ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_metadata( $type, $object_id, $meta_key, true ) );
	}

}
