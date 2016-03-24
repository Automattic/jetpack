<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-comments.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Comments extends WP_UnitTestCase {

	protected $post_id;

	public function setUp() {

		parent::setUp();

		Jetpack_Sync_Comments::init();
		Jetpack_Sync_Comments::$sync   = array();
		Jetpack_Sync_Comments::$delete = array();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
		$this->post_id = wp_insert_post( self::get_new_post_array() );

	}

	public function tearDown() {
		parent::tearDown();
		wp_delete_post( $this->post_id );
	}


	public function test_sync_comments_new_comment() {
		$comment_id = wp_insert_comment( self::get_new_comment_array() );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );

	}

	public function test_sync_comments_updated_comment() {
		$comment_array               = self::get_new_comment_array();
		$comment_id                  = wp_insert_comment( $comment_array );
		Jetpack_Sync_Comments::$sync = array();

		$comment_array['comment_content'] = 'updated comment content';
		$comment_array['comment_ID']      = $comment_id;
		wp_update_comment( $comment_array );

		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_delete() {
		$comment_id = self::add_new_comment();
		wp_delete_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_force_delete() {
		$comment_id = self::add_new_comment();
		wp_delete_comment( $comment_id, true );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::comments_to_delete() );
	}


	public function test_sync_comments_trash() {
		$comment_id = self::add_new_comment();
		wp_trash_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_untrash() {
		$comment_id = self::add_new_comment();
		wp_untrash_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_spam() {
		$comment_id = self::add_new_comment();
		wp_spam_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_unspam() {
		$comment_id = self::add_new_comment();
		wp_unspam_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_approve_and_unapprove() {
		$comment_id = self::add_new_comment();
		wp_set_comment_status( $comment_id, 'hold' );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );

		Jetpack_Sync_Comments::$sync = array();
		wp_set_comment_status( $comment_id, 1 );
		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_api() {
		$comment_array = self::get_new_comment_array();
		$comment_id    = wp_insert_comment( $comment_array );

		$comment_array['comment_content'] = 'really great comment';
		$comment_id2                      = wp_insert_comment( $comment_array );

		$api_output = Jetpack_Sync_Comments::comments_to_sync();

		$this->assertEquals( $comment_id, $api_output[ $comment_id ]['comment_ID'] );
		$this->assertEquals( $comment_id2, $api_output[ $comment_id2 ]['comment_ID'] );
	}

	public function test_sync_only_sync_20_comment_save_the_rest() {
		Jetpack_Sync_Comments::$sync = range( 0, ( Jetpack_Sync_Comments::$max_to_sync + 5 ) );

		$post_ids = Jetpack_Sync_Comments::get_comment_ids_to_sync();

		$this->assertContains( 0, $post_ids );
		$this->assertContains( ( Jetpack_Sync_Comments::$max_to_sync - 1 ), $post_ids );
		$this->assertNotContains( Jetpack_Sync_Comments::$max_to_sync, $post_ids );


		$this->assertTrue( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );

		$post_ids = Jetpack_Sync_Comments::get_comment_ids_to_sync();

		$this->assertContains( 0, $post_ids );
		$this->assertContains( 5, $post_ids );

		Jetpack_Sync::remove_cron();
		$this->assertFalse( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );

	}

	private function get_new_post_array() {
		return array(
			'post_title'   => 'this is the title',
			'post_content' => 'this is the content',
			'post_status'  => 'publish',
			'post_author'  => 1
		);
	}

	private function get_new_comment_array() {
		return array(
			'comment_post_ID'      => $this->post_id,
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

	private function add_new_comment() {
		$comment_array               = self::get_new_comment_array();
		$comment_id                  = wp_insert_comment( $comment_array );
		Jetpack_Sync_Comments::$sync = array();

		return $comment_id;
	}

}