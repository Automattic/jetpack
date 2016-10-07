<?php

/**
 * Testing CRUD on Meta
 */
class WP_Test_Jetpack_Sync_Meta extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $meta_module;

	public function setUp() {
		parent::setUp();

		// create a post
		$this->meta_module = Jetpack_Sync_Modules::get_module( "meta" );
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key' ) );
		$this->post_id = $this->factory->post->create();
		add_post_meta( $this->post_id, 'test_meta_key', 'foo' );
		$this->sender->do_sync();
	}

	public function test_added_post_meta_is_synced() {

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key' );

		$this->assertEquals( 'foo', $meta_key_value );
		$this->assertEquals( array( 'foo' ), $meta_key_array );
	}

	public function test_added_multiple_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array' ) );

		add_post_meta( $this->post_id, 'test_meta_key_array', 'foo' );
		add_post_meta( $this->post_id, 'test_meta_key_array', 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array' );

		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array_2' ) );
		add_post_meta( $this->post_id, 'test_meta_key_array_2', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_2', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_2' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_2' ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_key_array_3' ) );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_3' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_3' ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_delete' ) );
		add_post_meta( $this->post_id, 'test_meta_delete', 'foo' );

		delete_post_meta( $this->post_id, 'test_meta_delete', 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete' ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {
		$this->meta_module->set_post_meta_whitelist( array( 'test_meta_delete_all' ) );
		add_post_meta( $this->post_id, 'test_meta_delete_all', 'foo' );

		delete_metadata( 'post', $this->post_id, 'test_meta_delete_all', '', true );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all' ), $meta_key_array );
	}

	public function test_doesn_t_sync_private_meta() {
		// $ignore_meta_keys = array( '_edit_lock', '_pingme', '_encloseme' );
		add_post_meta( $this->post_id, '_private_meta', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals( null, $this->server_replica_storage->get_metadata( 'post', $this->post_id, '_private_meta', true ) );
	}

	public function test_sync_whitelisted_post_meta() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_post_meta = Jetpack_Sync_Defaults::$default_whitelist_post_meta_keys;

		// update all the opyions.
		foreach ( $white_listed_post_meta as $meta_key ) {
			add_post_meta( $this->post_id, $meta_key, 'foo' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_post_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'post', $this->post_id );
		}
		$whitelist = $this->meta_module->get_post_meta_whitelist();

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_post_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	public function test_sync_whitelisted_comment_meta() {
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options
		$white_listed_comment_meta = Jetpack_Sync_Defaults::$default_whitelist_comment_meta_keys;

		$comment_ids = $this->factory->comment->create_post_comments( $this->post_id );

		// update all the comment meta
		foreach ( $white_listed_comment_meta as $meta_key ) {
			add_comment_meta( $comment_ids[0], $meta_key, 'foo', 'comment' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_comment_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'comment', $comment_ids[0] );
		}
		$whitelist = $this->meta_module->get_comment_meta_whitelist();

		$whitelist_and_option_keys_difference = array_diff( $whitelist, $white_listed_comment_meta );
		// Are we testing all the options
		$unique_whitelist = array_unique( $whitelist );

		$this->assertEquals( count( $unique_whitelist ), count( $whitelist ), 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
		$this->assertTrue( empty( $whitelist_and_option_keys_difference ), 'Some whitelisted options don\'t have a test: ' . print_r( $whitelist_and_option_keys_difference, 1 ) );
	}

	function assertOptionIsSynced( $meta_key, $value, $type, $object_id ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_metadata( $type, $object_id, $meta_key, true ) );
	}

}
