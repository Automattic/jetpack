<?php
// phpunit --filter test_sync_
class WP_Test_Jetpack_Sync extends WP_UnitTestCase {

	protected $_globals;

	public function setUp() {
		require_once dirname( __FILE__ ) . '/../../class.jetpack-rest-sync.php';
		parent::setUp();
		Jetpack_Rest_Sync::$posts['new'] = array();
		Jetpack_Rest_Sync::$posts['update'] = array();
		Jetpack_Rest_Sync::$posts['delete'] = array();

	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_sync_new_post() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);
		$post_id = wp_insert_post( $new_post );
		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['new'] );
	}

	public function test_sync_update_post() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);
		$post_id = wp_insert_post( $new_post );

		wp_update_post( array(
			'ID' => $post_id,
			'post_title'    => 'this is the updated title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		) );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['update'] );
	}

	public function test_sync_status_change() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $new_post );

		wp_update_post( array(
			'ID' => $post_id,
			'post_status'   => 'publish',
		) );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['update'] );
	}

	public function test_sync_add_post_meta() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);
		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'red', true );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['update'] );
	}

	public function test_sync_update_post_meta() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'red' );
		// Reset the array since if the add post meta test passes so should the test.
		Jetpack_Rest_Sync::$posts['update'] = array();

		update_post_meta( $post_id, '_color', 'blue' );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['update'] );
	}


	public function test_sync_delete_post_meta() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'blue' );
		// Reset the array since if the add post meta test passes so should the test.
		Jetpack_Rest_Sync::$posts['update'] = array();

		delete_post_meta( $post_id, '_color', 'blue' );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['update'] );
	}

	public function test_sync_delete_post() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $new_post );

		wp_delete_post( $post_id );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['delete'] );
	}

	public function test_sync_force_delete_post() {
		$new_post = array(
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);

		$post_id = wp_insert_post( $new_post );

		wp_delete_post( $post_id, true );

		$this->assertContains( $post_id, Jetpack_Rest_Sync::$posts['delete'] );
	}
}
