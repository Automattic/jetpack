<?php

/**
 * Testing CRUD on Meta
 */
class WP_Test_Jetpack_Sync_Meta extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();

		// create a post
		$this->post_id    = $this->factory->post->create();
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
		add_post_meta( $this->post_id, 'test_meta_key_array', 'foo' );
		add_post_meta( $this->post_id, 'test_meta_key_array', 'bar' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array' );

		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		add_post_meta( $this->post_id, 'test_meta_key_array_2', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_2', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_2' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_2' ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'bar', 'foo' );

		$this->sender->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_3' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_3' ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		add_post_meta( $this->post_id, 'test_meta_delete', 'foo' );

		delete_post_meta( $this->post_id, 'test_meta_delete', 'foo' );
		$this->sender->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete' ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {
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


	// TODO:
	// Add tests for other post meta
	// Add test for other meta functions
}
