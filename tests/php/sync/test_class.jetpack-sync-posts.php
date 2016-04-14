<?php
require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-client.php';
require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-meta.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Posts extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		parent::setUp();

		Jetpack_Sync::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();
		wp_delete_post( $this->post_id );
	}

	public function test_sync_new_post() {
		$this->post_id = wp_insert_post( self::get_new_post_array() );
		$actions_to_sync = Jetpack_Sync::get_actions_to_sync();

		$this->assert_has_action();
	}


	public function test_sync_update_post() {
		$this->post_id = wp_insert_post( self::get_new_post_array() );
		self::reset_sync();

		wp_update_post( array(
			'ID'         => $this->post_id,
			'post_title' => 'this is the updated title',
		) );

		$this->assert_has_action();
	}

	public function test_sync_but_not_post_revisions() {
		$new_revision              = self::get_new_post_array();
		$new_revision['post_type'] = 'revision';
		$this->post_id             = wp_insert_post( $new_revision );

		$actions_to_sync = Jetpack_Sync::get_actions_to_sync();
		$this->assertEmpty( $actions_to_sync );
		$this->assertFalse( Jetpack_Sync::$do_shutdown );
	}

	public function test_sync_new_page() {
		$new_page              = self::get_new_post_array();
		$new_page['post_type'] = 'page';
		$this->post_id         = wp_insert_post( $new_page );

		$this->assert_has_action();
	}

	public function test_sync_status_change() {
		$new_post      = self::get_new_post_array();
		$this->post_id = wp_insert_post( $new_post );
		self::reset_sync();
		wp_update_post( array(
			'ID'          => $this->post_id,
			'post_status' => 'publish',
		) );

		$this->assert_has_action();
	}
//	/**
//	 * @runInSeparateProcess
//	 * @preserveGlobalState disabled
//	 */
//	/*
//		public function test_sync_do_not_sync_when_doing_autosave() {
//			$post_id = wp_insert_post( self::get_new_post_array() );
//		  self::reset_sync();
//			wp_autosave( array_merge( self::get_new_post_array(), array(
//				'post_id' => $post_id,
//				'_wpnonce' => wp_create_nonce( 'update-post_' . $post_id ),
//			) ) );
//
//			$this->assertNotContains( $post_id, Jetpack_Sync_Posts::posts_to_sync() );
//		}
//	*/

//	public function test_sync_add_post_meta() {
//		$new_post      = self::get_new_post_array();
//		$this->post_id = wp_insert_post( $new_post );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//		add_post_meta( $this->post_id, '_color', 'red', true );
//
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_update_post_meta() {
//		$new_post      = self::get_new_post_array();
//		$this->post_id = wp_insert_post( $new_post );
//		add_post_meta( $this->post_id, '_color', 'red' );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//
//		update_post_meta( $this->post_id, '_color', 'blue' );
//
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_do_not_sync_when_edit_lock_is_set() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//		add_post_meta( $this->post_id, '_edit_lock', time() );
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//		$this->assertFalse( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_delete_post_meta() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//		add_post_meta( $this->post_id, '_color', 'blue' );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//		delete_post_meta( $this->post_id, '_color', 'blue' );
//
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_set_category_on_a_post() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//		wp_set_post_categories( $this->post_id, self::create_category() );
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_delete_category_sync_post() {
//		$new_post                  = self::get_new_post_array();
//		$my_cat_id                 = self::create_category();
//		$new_post['post_category'] = array( $my_cat_id );
//		$this->post_id             = wp_insert_post( $new_post );
//
//		// Reset the array since if the add post meta test passes so should the test.
//		self::reset_sync();
//		wp_delete_term( $my_cat_id, 'category' );
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_set_tags_on_a_post() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//
//		// Reset things
//		self::reset_sync();
//		wp_set_post_tags( $this->post_id, 'meaning,life' );
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_set_taxonomy_on_a_post() {
//		$args = array(
//			'hierarchical'      => true,
//			'show_ui'           => true,
//			'show_admin_column' => true,
//			'query_var'         => true,
//			'rewrite'           => array( 'slug' => 'genre' ),
//		);
//
//		register_taxonomy( 'drink', array( 'post' ), $args );
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//
//		// Reset things
//		self::reset_sync();
//		wp_set_post_terms( $this->post_id, 'coke,pepsi', 'drink' );
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_custom_post_type() {
//		$args = array(
//			'public' => true,
//			'label'  => 'Papers'
//		);
//		register_post_type( 'paper', $args );
//
//		$new_post              = self::get_new_post_array();
//		$new_post['post_type'] = 'paper';
//		$this->post_id         = wp_insert_post( $new_post );
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_set_taxonomy_on_a_custom_post_type() {
//		$args = array(
//			'label' => 'Books'
//		);
//		register_post_type( 'book', $args );
//
//		add_filter( 'jetpack_post_sync_post_type', array(
//			__CLASS__,
//			'add_filter_jetpack_post_sync_post_type'
//		), 10, 1 );
//
//		$args_taxonomy = array(
//			'hierarchical'      => true,
//			'show_ui'           => true,
//			'show_admin_column' => true,
//			'query_var'         => true,
//			'rewrite'           => array( 'slug' => 'genre' ),
//		);
//		register_taxonomy( 'genre', array( 'book' ), $args_taxonomy );
//
//		$new_post              = self::get_new_post_array();
//		$new_post['post_type'] = 'book';
//		$this->post_id         = wp_insert_post( $new_post );
//
//		self::reset_sync();
//		wp_set_object_terms( $this->post_id, 'mystery,fantasy', 'genre' );
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//
//	}
//
//	public static function add_filter_jetpack_post_sync_post_type( $post_types ) {
//		$post_types[] = 'book';
//
//		return $post_types;
//	}
//
//	public function test_sync_insert_attachment_post() {
//		$filename = dirname( __FILE__ ) . '/../files/jetpack.jpg';
//
//		// The ID of the post this attachment is for.
//		$parent_post_id = wp_insert_post( self::get_new_post_array() );
//
//		// Check the type of file. We'll use this as the 'post_mime_type'.
//		$filetype = wp_check_filetype( basename( $filename ), null );
//
//		// Get the path to the upload directory.
//		$wp_upload_dir = wp_upload_dir();
//
//		// Prepare an array of post data for the attachment.
//		$attachment = array(
//			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
//			'post_mime_type' => $filetype['type'],
//			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
//			'post_content'   => '',
//			'post_status'    => 'inherit'
//		);
//
//		// Insert the attachment.
//		$attach_id = wp_insert_attachment( $attachment, $filename, $parent_post_id );
//
//		$this->assertContains( $attach_id, Jetpack_Sync_Posts::get_post_ids_that_changed(), 'abc' );
//		$this->assertContains( $parent_post_id, Jetpack_Sync_Posts::get_post_ids_that_changed(), 'bbb' );
//
//		// Make sure that this file is included, as wp_generate_attachment_metadata() depends on it.
//		require_once( ABSPATH . 'wp-admin/includes/image.php' );
//
//		// Generate the metadata for the attachment, and update the database record.
//		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
//		self::reset_sync();
//
//		$meta_id = wp_update_attachment_metadata( $attach_id, $attach_data );
//
//		$meta_id_post_parent = set_post_thumbnail( $parent_post_id, $attach_id );
//		$posts_changed = Jetpack_Sync_Posts::get_post_ids_that_changed();
//
//		$this->assertNotContains( $attach_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//
//		$this->assertContains( array(
//			'id'      => $meta_id,
//			'key'     => '_wp_attachment_metadata',
//			'post_id' => $attach_id,
//			'value'   => $attach_data
//		), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );
//
//		$this->assertContains( array(
//			'id'      => $meta_id_post_parent,
//			'key'     => '_thumbnail_id',
//			'post_id' => $parent_post_id,
//			'value'   => $attach_id
//		), Jetpack_Sync_Meta::meta_to_sync( 'post' ) );
//
//		$this->assertNotContains( $attach_id, $posts_changed );
//		$this->assertNotContains( $parent_post_id, $posts_changed );
//
//	}
//
//	public function test_sync_post_data_when_new_comment_gets_added() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//		self::reset_sync();
//		wp_insert_comment( self::get_new_comment_array( $this->post_id ) );
//
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::post_comment_count_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_post_data_when_new_comment_gets_deleted() {
//		$this->post_id = wp_insert_post( self::get_new_post_array() );
//		$comment_id    = wp_insert_comment( self::get_new_comment_array( $this->post_id ) );
//
//		self::reset_sync();
//		wp_delete_comment( $comment_id );
//
//		$this->assertNotContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayNotHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::post_comment_count_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_post_when_author_deleted() {
//		$user_id                       = self::create_user( 'test_user_2' );
//		$new_post_array                = self::get_new_post_array();
//		$new_post_array['post_author'] = $user_id;
//
//		$post_id = wp_insert_post( $new_post_array );
//		self::reset_sync();
//		wp_delete_user( $user_id );
//
//		$this->assertContains( $post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
//	public function test_sync_post_when_author_deleted_but_post_reasigned() {
//		$user_id                       = self::create_user( 'test_user_3' );
//		$new_post_array                = self::get_new_post_array();
//		$new_post_array['post_author'] = $user_id;
//
//		$this->post_id = wp_insert_post( $new_post_array );
//		self::reset_sync();
//
//		wp_delete_user( $user_id, 1 ); // 1 is the Admin of
//
//		$this->assertContains( $this->post_id, Jetpack_Sync_Posts::get_post_ids_that_changed() );
//		$this->assertArrayHasKey( $this->post_id, Jetpack_Sync_Posts::posts_to_sync() );
//	}
//
	public function test_sync_delete_post() {
		$post_id = wp_insert_post( self::get_new_post_array() );
		self::reset_sync();
		wp_delete_post( $post_id );

		// The post isn't delete yet but it is marked as trash.
		$this->assert_has_action( 'wp_insert_post', $post_id );
	}

	public function test_sync_force_delete_post() {
		$post_id = wp_insert_post( self::get_new_post_array() );
		self::reset_sync();
		wp_delete_post( $post_id, true );
		$this->assert_has_action( 'delete_post', $post_id );
	}

//	public function test_sync_new_post_api_format() {
//		$post_id1   = wp_insert_post( self::get_new_post_array() );
//		$post_id2   = wp_insert_post( self::get_new_post_array() );
//
//
//		$this->assert_has_action( 'wp_insert_post', $post_id2 );
//	}
//
//	public function test_sync_only_sync_10_posts_save_the_rest() {
//		Jetpack_Sync_Posts::$sync = range( 0, ( Jetpack_Sync_Posts::$max_to_sync + 5 ) );
//
//		$post_ids = Jetpack_Sync_Posts::get_post_ids_that_changed();
//
//		$this->assertContains( 0, $post_ids );
//		$this->assertContains( Jetpack_Sync_Posts::$max_to_sync - 1, $post_ids );
//		$this->assertNotContains( Jetpack_Sync_Posts::$max_to_sync, $post_ids );
//
//
//		$this->assertTrue( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );
//
//		$post_ids = Jetpack_Sync_Posts::get_post_ids_that_changed();
//
//		$this->assertContains( 0, $post_ids );
//		$this->assertContains( 5, $post_ids );
//
//		Jetpack_Sync::remove_cron();
//		$this->assertFalse( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );
//
//	}

	private function reset_sync() {

		Jetpack_Sync::$actions   = array();
		Jetpack_Sync::$client->reset_actions();

//		Jetpack_Sync_Posts::$sync   = array();
//		Jetpack_Sync_Posts::$delete = array();
//		Jetpack_Sync_Posts::$sync_comment_count = array();
//
//		Jetpack_Sync_Meta::$sync = array();
//		Jetpack_Sync_Meta::$delete = array();

		Jetpack_Sync::$do_shutdown  = false;
	}

	private function assert_has_action( $action = 'wp_insert_post', $post_id = null ) {
		if(  is_null( $post_id ) ) {
			$post_id = $this->post_id;
		}
		$actions_to_sync = Jetpack_Sync::get_actions_to_sync();
		$this->assertEquals( $actions_to_sync[0][0], $action );
		$this->assertEquals( $actions_to_sync[0][1][0], $post_id );
		$this->assertEquals( sizeof( $actions_to_sync ), 1 );
		$this->assertTrue( Jetpack_Sync::$do_shutdown );
	}

	private function create_user( $user_login ) {
		$user_data = array(
			'user_login' => $user_login,
			'user_pass'  => md5( time() ),
			'user_email' => 'email@example2.com',
			'role'       => 'author'
		);

		return wp_insert_user( $user_data );
	}

	private function create_category() {
		$my_cat = array(
			'cat_name'             => 'My Category',
			'category_description' => 'A Cool Category',
			'category_nicename'    => 'category-slug',
			'category_parent'      => ''
		);

		return wp_insert_category( $my_cat );
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

	private function get_new_comment_array( $post_id ) {
		return array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => 'admin',
			'comment_author_email' => 'admin@admin.com',
			'comment_author_url'   => 'http://',
			'comment_content'      => 'content here',
			'comment_type'         => '',
			'comment_parent'       => 0,
			'user_id'              => 1,
			'comment_author_IP'    => '127.0.0.1',
			'comment_agent'        => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10 (.NET CLR 3.5.30729)',
			'comment_date'         => current_time( 'mysql' ),
			'comment_approved'     => 1,
		);
	}
}
