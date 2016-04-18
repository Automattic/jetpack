<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-meta.php';
/**
 * Testing CRUD on Meta
 */
class WP_Test_Jetpack_New_Sync_Meta extends WP_Test_Jetpack_New_Sync_Base {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->client->reset_state();

		// create a post
		$this->post_id    = $this->factory->post->create();
		add_post_meta( $this->post_id, 'test_meta_key', 'foo' );
		$this->client->do_sync();
	}

	public function tearDown() {
		parent::tearDown();

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
		
		$this->client->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array' );
		
		$this->assertEquals( array( 'foo', 'bar' ), $meta_key_array );
	}

	public function test_add_then_updated_post_meta_is_synced() {
		add_post_meta( $this->post_id, 'test_meta_key_array_2', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_2', 'bar', 'foo' );

		$this->client->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_2' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_2' ), $meta_key_array );
	}

	public function test_updated_post_meta_is_synced() {
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'foo' );
		update_post_meta( $this->post_id, 'test_meta_key_array_3', 'bar', 'foo' );

		$this->client->do_sync();

		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_key_array_3' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_key_array_3' ), $meta_key_array );
	}

	public function test_deleted_post_meta_is_synced() {
		add_post_meta( $this->post_id, 'test_meta_delete', 'foo' );

		delete_post_meta( $this->post_id, 'test_meta_delete', 'foo' );
		$this->client->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete' );

		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete' ), $meta_key_array );
	}

	public function test_delete_all_post_meta_is_synced() {
		add_post_meta( $this->post_id, 'test_meta_delete_all', 'foo' );

		delete_metadata( 'post', $this->post_id, 'test_meta_delete_all', '', true );
		$this->client->do_sync();

		$meta_key_value = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all', true );
		$meta_key_array = $this->server_replica_storage->get_metadata( 'post', $this->post_id, 'test_meta_delete_all' );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all', true ), $meta_key_value );
		$this->assertEquals( get_post_meta( $this->post_id, 'test_meta_delete_all' ), $meta_key_array );
	}


	// TODO:
	// Add tests for other post meta
	// Add test for other meta functions
}


// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Meta extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		parent::setUp();

		Jetpack_Sync_Meta::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();
		wp_delete_post( $this->post_id );
	}

	public function test_sync_add_post_meta() {
		$new_post      = self::get_new_post_array();
		$this->post_id = wp_insert_post( $new_post );

		// Reset the array since if the add post meta test passes so should the test.
		self::reset_sync();
		$id = add_post_meta( $this->post_id, '_color', 'red', true );

		$this->assertContains( array(
			'id'      => $id,
			'post_id' => $this->post_id,
			'key'     => '_color',
			'value'   => 'red'
		), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

		self::reset_sync();

		$id = add_post_meta( $this->post_id, '_color', 'blue', true );
		$this->assertNotContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'blue'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		self::reset_sync();

		$id  = add_post_meta( $this->post_id, '_color2', 'yellow' );
		$id2 = add_post_meta( $this->post_id, '_color2', 'gray' );

		$this->assertContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color2',
				'value'   => 'yellow'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		$this->assertContains(
			array(
				'id'      => $id2,
				'post_id' => $this->post_id,
				'key'     => '_color2',
				'value'   => 'gray'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );
	}

	public function test_sync_update_post_meta_update_more() {
		$new_post      = self::get_new_post_array();
		$this->post_id = wp_insert_post( $new_post );
		$id            = add_post_meta( $this->post_id, '_color', 'red' );
		$id2           = add_post_meta( $this->post_id, '_color', 'green' );

		$this->assertContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'red'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		$this->assertContains(
			array(
				'id'      => $id2,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'green'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		$this->assertTrue( Jetpack_Sync::$do_shutdown );

		// Reset the array since if the add post meta test passes so should the test.
		self::reset_sync();
		update_post_meta( $this->post_id, '_color', 'blue' );

		$this->assertContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'blue'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		$this->assertTrue( Jetpack_Sync::$do_shutdown );

		self::reset_sync();
		$id = add_post_meta( $this->post_id, '_color', 'yellow' );
		update_post_meta( $this->post_id, '_color', 'orange', 'yellow' );

		$this->assertContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'orange'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );

		$this->assertNotContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'yellow'
			), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );


	}

	public function test_sync_delete_post_meta() {
		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$id            = add_post_meta( $this->post_id, '_color', 'blue' );

		// Reset the array since if the add post meta test passes so should the test.
		self::reset_sync();
		delete_post_meta( $this->post_id, '_color', 'blue' );

		$this->assertContains( array(
			'id'      => array( $id ),
			'post_id' => $this->post_id,
			'key'     => '_color',
			'value'   => 'blue'
		), Jetpack_Sync_Meta::meta_to_delete( 'post' ) );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

	}

	public function test_sync_delete_post_meta_all() {
		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$id1           = add_post_meta( $this->post_id, '_color', 'blue' );

		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$id2           = add_post_meta( $this->post_id, '_color', 'red' );

		delete_metadata( 'post', null, '_color', '', true );

		$deleted_data = Jetpack_Sync_Meta::meta_to_delete( 'post' );

		$this->assertContains( $id1, $deleted_data[0]['id'] );
		$this->assertContains( $id2, $deleted_data[0]['id'] );
		$this->assertEquals( 0, $deleted_data[0]['post_id'] );
		$this->assertEquals( '_color', $deleted_data[0]['key'] );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_add_post_meta_unique() {
		$new_post      = self::get_new_post_array();
		$this->post_id = wp_insert_post( $new_post );

		// Reset the array since if the add post meta test passes so should the test.
		self::reset_sync();
		$id = add_post_meta( $this->post_id, '_color', 'red', true );

		$this->assertContains( array(
			'id'      => $id,
			'post_id' => $this->post_id,
			'key'     => '_color',
			'value'   => 'red'
		), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

	}


	private function reset_sync() {
		Jetpack_Sync_Meta::$sync   = array();
		Jetpack_Sync_Meta::$delete  = array();
		Jetpack_Sync::$do_shutdown = false;
	}

	private function get_new_post_array() {
		return array(
			'post_title'   => 'this is the title',
			'post_content' => 'this is the content',
			'post_status'  => 'draft',
			'post_type'    => 'post',
			'post_author'  => 1,
		);
	}

}