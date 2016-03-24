<?php
require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-post-meta.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Post_Meta extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		parent::setUp();

		Jetpack_Sync_Post_Meta::init();
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
		), Jetpack_Sync_Post_Meta::post_meta_to_sync() );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

		self::reset_sync();

		$id = add_post_meta( $this->post_id, '_color', 'blue', true );
		$this->assertNotContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'blue'
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );

		self::reset_sync();

		$id  = add_post_meta( $this->post_id, '_color2', 'yellow' );
		$id2 = add_post_meta( $this->post_id, '_color2', 'gray' );

		$this->assertContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color2',
				'value'   => 'yellow'
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );
		$this->assertContains(
			array(
				'id'      => $id2,
				'post_id' => $this->post_id,
				'key'     => '_color2',
				'value'   => 'gray'
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );
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
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );

		$this->assertContains(
			array(
				'id'      => $id2,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'green'
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );

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
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );

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
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );
		
		$this->assertNotContains(
			array(
				'id'      => $id,
				'post_id' => $this->post_id,
				'key'     => '_color',
				'value'   => 'yellow'
			), Jetpack_Sync_Post_Meta::post_meta_to_sync() );


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
		), Jetpack_Sync_Post_Meta::post_meta_to_delete() );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

	}

	public function test_sync_delete_post_meta_all() {
		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$id1           = add_post_meta( $this->post_id, '_color', 'blue' );

		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$id2           = add_post_meta( $this->post_id, '_color', 'red' );

		delete_metadata( 'post', null, '_color', '', true );

		$deleted_data = Jetpack_Sync_Post_Meta::post_meta_to_delete();

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
		), Jetpack_Sync_Post_Meta::post_meta_to_sync() );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );

	}


	private function reset_sync() {
		Jetpack_Sync_Post_Meta::$sync   = array();
		Jetpack_Sync_Post_Meta::$delete = array();
		Jetpack_Sync::$do_shutdown      = false;
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