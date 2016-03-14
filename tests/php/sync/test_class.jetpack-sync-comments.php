<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-comments.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Sync_Comments extends WP_UnitTestCase {

	protected $post_id;

	public function setUp() {

		parent::setUp();

		Jetpack_Comments_Sync::init();
		Jetpack_Comments_Sync::$sync = array();
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
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );

	}

	public function test_sync_comments_updated_comment() {
		$comment_array = self::get_new_comment_array();
		$comment_id = wp_insert_comment( $comment_array );
		Jetpack_Comments_Sync::$sync = array();

		$comment_array['comment_content'] = 'updated comment content';
		$comment_array['comment_ID'] = $comment_id;
		wp_update_comment( $comment_array );

		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_delete() {
		$comment_id = self::add_new_comment();
		wp_delete_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_force_delete() {
		$comment_id = self::add_new_comment();
		wp_delete_comment( $comment_id, true );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_delete() );
	}


	public function test_sync_comments_trash() {
		$comment_id = self::add_new_comment();
		wp_trash_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_untrash() {
		$comment_id = self::add_new_comment();
		wp_untrash_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_spam() {
		$comment_id = self::add_new_comment();
		wp_spam_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_unspam() {
		$comment_id = self::add_new_comment();
		wp_unspam_comment( $comment_id );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	public function test_sync_comments_approve_and_unapprove() {
		$comment_id = self::add_new_comment();
		wp_set_comment_status( $comment_id, 'hold' );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );

		Jetpack_Comments_Sync::$sync = array();
		wp_set_comment_status( $comment_id, 1 );
		$this->assertContains( $comment_id, Jetpack_Comments_Sync::get_comment_ids_to_sync() );
	}

	private function get_new_post_array() {
		return array (
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'publish',
			'post_author'   => 1
		);
	}

	private function get_new_comment_array() {
		return array (
			'comment_post_ID' => $this->post_id,
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

	private function add_new_comment(){
		$comment_array = self::get_new_comment_array();
		$comment_id = wp_insert_comment( $comment_array );
		Jetpack_Comments_Sync::$sync = array();
		return $comment_id;
	}

}