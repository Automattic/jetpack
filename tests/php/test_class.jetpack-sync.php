<?php
// phpunit --filter test_sync_
class WP_Test_Jetpack_Sync extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		require_once dirname( __FILE__ ) . '/../../class.jetpack-post-sync.php';
		parent::setUp();

		Jetpack_Post_Sync::init();
		Jetpack_Post_Sync::$sync = array();
		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );

	}

	public function tearDown() {
		parent::tearDown();
		wp_delete_post( $this->post_id );
	}

	public function test_sync_new_post() {
		$new_post = self::get_new_post_array();
		$post_id = wp_insert_post( $new_post );
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_update_post() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );

		wp_update_post( array(
			'ID' => $post_id,
			'post_title'    => 'this is the updated title',
		) );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_but_not_post_revisions() {
		$new_revision = self::get_new_post_array();
		$new_revision['post_type'] = 'revision';
		$post_id = wp_insert_post( $new_revision );

		$this->assertNotContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_new_page() {

		$new_page = self::get_new_post_array();
		$new_page['post_type'] = 'page';
		$post_id = wp_insert_post( $new_page );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_status_change() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );
		Jetpack_Post_Sync::$sync = array();

		wp_update_post( array(
			'ID' => $post_id,
			'post_status'   => 'publish',
		) );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_add_post_meta() {
		$new_post = self::get_new_post_array();
		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'red', true );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_update_post_meta() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'red' );
		// Reset the array since if the add post meta test passes so should the test.
		Jetpack_Post_Sync::$sync = array();

		update_post_meta( $post_id, '_color', 'blue' );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_delete_post_meta() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );

		add_post_meta( $post_id, '_color', 'blue' );
		// Reset the array since if the add post meta test passes so should the test.
		Jetpack_Post_Sync::$sync = array();

		delete_post_meta( $post_id, '_color', 'blue' );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_set_category_on_a_post() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );
		Jetpack_Post_Sync::$sync = array();

		$my_cat = array(
			'cat_name' => 'My Category',
			'category_description' => 'A Cool Category',
			'category_nicename' => 'category-slug',
			'category_parent' => '' );

		// Create the category
		$my_cat_id = wp_insert_category( $my_cat );

		wp_set_post_categories( $post_id, $my_cat_id );
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_delete_category_sync_post() {
		$new_post = self::get_new_post_array();

		$my_cat = array(
			'cat_name' => 'My Category',
			'category_description' => 'A Cool Category',
			'category_nicename' => 'category-slug',
			'category_parent' => '' );
		$my_cat_id = wp_insert_category( $my_cat );

		$new_post[ 'post_category' ] = array( $my_cat_id );
		$post_id = wp_insert_post( $new_post );


		Jetpack_Post_Sync::$sync = array();

		wp_delete_term( $my_cat_id, 'category' );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_set_tags_on_a_post() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );
		// Reset things
		Jetpack_Post_Sync::$sync = array();

		wp_set_post_tags( $post_id, 'meaning,life' );
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_set_taxonomy_on_a_post() {
		$args = array(
			'hierarchical'      => true,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'genre' ),
		);

		register_taxonomy( 'drink', array( 'post' ), $args );

		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );
		// Reset things
		Jetpack_Post_Sync::$sync = array();
		wp_set_post_terms( $post_id, 'coke,pepsi', 'drink' );
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );

	}

	public function test_sync_set_taxonomy_on_a_custom_post_type() {
		$args = array(
			'public' => true,
			'label'  => 'Books'
		);
		register_post_type( 'book', $args );

		add_filter( 'jetpack_post_sync_post_type', array( __CLASS__, 'add_filter_jetpack_post_sync_post_type' ), 10, 1 );

		$args_taxonomy = array(
			'hierarchical'      => true,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'genre' ),
		);
		register_taxonomy( 'genre', array( 'book' ), $args_taxonomy );

		$new_post = self::get_new_post_array();
		$new_post['post_type'] = 'book';

		$post_id = wp_insert_post( $new_post );
		// Reset things
		Jetpack_Post_Sync::$sync = array();
		wp_set_object_terms( $post_id, 'mystery,fantasy', 'genre' );
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );

	}

	public static function add_filter_jetpack_post_sync_post_type( $post_types ) {
		$post_types[] = 'book';
		return $post_types;
	}

	public function test_sync_insert_attachment_post() {
		$filename = dirname( __FILE__ ).'/files/jetpack.jpg';

		// The ID of the post this attachment is for.
		$parent_post_id = wp_insert_post( self::get_new_post_array() );

		// Check the type of file. We'll use this as the 'post_mime_type'.
		$filetype = wp_check_filetype( basename( $filename ), null );

		// Get the path to the upload directory.
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => '',
			'post_status'    => 'inherit'
		);

		// Insert the attachment.
		$attach_id = wp_insert_attachment( $attachment, $filename, $parent_post_id );

		$this->assertContains( $attach_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
		$this->assertContains( $parent_post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
		// Make sure that this file is included, as wp_generate_attachment_metadata() depends on it.
		require_once( ABSPATH . 'wp-admin/includes/image.php' );

		// Generate the metadata for the attachment, and update the database record.
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );

		Jetpack_Post_Sync::$sync = array();
		wp_update_attachment_metadata( $attach_id, $attach_data );
		set_post_thumbnail( $parent_post_id, $attach_id );

		$this->assertContains( $attach_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
		$this->assertContains( $parent_post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_post_data_when_new_comment_gets_added() {
		$post_id = wp_insert_post( self::get_new_post_array() );

		$comment_id = wp_insert_comment( self::get_new_comment_array( $post_id ) );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_post_data_when_new_comment_gets_deleted() {
		$post_id = wp_insert_post( self::get_new_post_array() );

		$comment_id = wp_insert_comment( self::get_new_comment_array( $post_id ) );

		Jetpack_Post_Sync::$sync = array();
		wp_delete_comment( $comment_id );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_post_when_author_deleted() {
		$user_data = array(
			'user_login'  =>  'test_user2',
			'user_pass'   => md5( time() ),
			'user_email'  => 'email@example.com',
			'role'		  => 'author'
		);

		$user_id = wp_insert_user( $user_data );
		$new_post_array = self::get_new_post_array();
		$new_post_array['post_author'] = $user_id;

		$post_id = wp_insert_post( $new_post_array );

		wp_delete_user( $user_id );

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_post_when_author_deleted_but_post_reasigned() {
		$user_data = array(
			'user_login'  =>  'test_user3',
			'user_pass'   => md5( time() ),
			'user_email'  => 'email@example2.com',
			'role'		  => 'author'
		);

		$user_id = wp_insert_user( $user_data );
		$new_post_array = self::get_new_post_array();
		$new_post_array['post_author'] = $user_id;

		$post_id = wp_insert_post( $new_post_array );
		Jetpack_Post_Sync::$sync = array();

		wp_delete_user( $user_id, 1 ); // 1 is the Admin of

		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_delete_post() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );

		wp_delete_post( $post_id );
		Jetpack_Post_Sync::get_post_ids_to_sync();
		// The post isn't delete yet but it only maked as trash.
		$this->assertContains( $post_id, Jetpack_Post_Sync::get_post_ids_to_sync() );
	}

	public function test_sync_force_delete_post() {
		$new_post = self::get_new_post_array();

		$post_id = wp_insert_post( $new_post );

		wp_delete_post( $post_id, true );

		$this->assertContains( $post_id, Jetpack_Post_Sync::posts_to_delete() );
	}

	private function get_new_post_array() {
		return array (
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_author'   => 1,
		);
	}

	private function get_new_comment_array( $post_id ) {
		return array (
			'comment_post_ID' => $post_id,
			'comment_author' => 'admin',
			'comment_author_email' => 'admin@admin.com',
			'comment_author_url' => 'http://',
			'comment_content' => 'content here',
			'comment_type' => '',
			'comment_parent' => 0,
			'user_id' => 1,
			'comment_author_IP' => '127.0.0.1',
			'comment_agent' => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10 (.NET CLR 3.5.30729)',
			'comment_date' => current_time('mysql'),
			'comment_approved' => 1,
		);
	}

	public function test_sync_new_post_api_format() {
		$post_id1 = wp_insert_post( self::get_new_post_array() );
		$post_id2 = wp_insert_post( self::get_new_post_array() );
		$api_output = Jetpack_Post_Sync::posts_to_sync();
		$this->assertContains( array( 'ID' => $post_id1 ),  $api_output[ $post_id1 ] );
		$this->assertContains( array( 'ID' => $post_id2 ),  $api_output[ $post_id2 ] );
	}
}
