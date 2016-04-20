<?php

require_once dirname( __FILE__ ) . '/../../../sync/class.jetpack-sync-comments.php';

/**
 * Testing CRUD on Comments
 */
class WP_Test_Jetpack_New_Sync_Comments extends WP_Test_Jetpack_New_Sync_Base {

	protected $comment;

	public function setUp() {
		parent::setUp();

		$comment_ids = $this->factory->comment->create_post_comments(
			$this->factory->post->create()
		);

		$this->comment = get_comment( $comment_ids[0] );

		$this->client->do_sync();
	}

	public function test_add_comment_syncs_event() {

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );

		$this->assertNotEquals( false, $event );
		$this->assertEquals( 'wp_insert_comment', $event->action );
		$this->assertEquals( $this->comment->comment_ID, $event->args[0] );
		$this->assertEquals( $this->comment, $event->args[1] );
	}

	public function test_add_comment_syncs_comment_data() {
		// post stored by server should equal post in client
		$this->assertEquals( 1, $this->server_replica_storage->comment_count() );
		$this->assertEquals( $this->comment, $this->server_replica_storage->get_comment( $this->comment->comment_ID ) );
	}

	public function test_update_comment() {
		$this->comment->comment_content = "foo bar baz";

		wp_update_comment( (array) $this->comment );

		$this->client->do_sync();

		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );

		$this->assertEquals( "foo bar baz", $remote_comment->comment_content );
	}

	public function test_trash_comment_trashes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_delete_comment_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment, true );

		$this->client->do_sync();

		// there should be no comments at all
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_wp_trash_comment() {
		wp_trash_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_wp_untrash_comment() {
		wp_trash_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		wp_untrash_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_wp_spam_comment() {
		wp_spam_comment( $this->comment );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'spam' ) );
	}
}

// phpunit --testsuite sync
//class WP_Test_Jetpack_Sync_Comments extends WP_UnitTestCase {
//
//	public function test_sync_comments_unspam() {
//		$comment_id = self::add_new_comment();
//		wp_unspam_comment( $comment_id );
//		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_comments_approve_and_unapprove() {
//		$comment_id = self::add_new_comment();
//		wp_set_comment_status( $comment_id, 'hold' );
//		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//
//		Jetpack_Sync_Comments::$sync = array();
//		wp_set_comment_status( $comment_id, 1 );
//		$this->assertContains( $comment_id, Jetpack_Sync_Comments::get_comment_ids_to_sync() );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_comments_api() {
//		$comment_array = self::get_new_comment_array();
//		$comment_id    = wp_insert_comment( $comment_array );
//
//		$comment_array['comment_content'] = 'really great comment';
//		$comment_id2                      = wp_insert_comment( $comment_array );
//
//		$api_output = Jetpack_Sync_Comments::comments_to_sync();
//
//		$this->assertEquals( $comment_id, $api_output[ $comment_id ]['comment_ID'] );
//		$this->assertEquals( $comment_id2, $api_output[ $comment_id2 ]['comment_ID'] );
//		$this->assertTrue( Jetpack_Sync::$do_shutdown );
//	}
//
//	public function test_sync_only_sync_20_comment_save_the_rest() {
//		Jetpack_Sync_Comments::$sync = range( 0, ( Jetpack_Sync_Comments::$max_to_sync + 5 ) );
//
//
//		$post_ids = Jetpack_Sync_Comments::get_comment_ids_to_sync();
//
//		$this->assertContains( 0, $post_ids );
//		$this->assertContains( ( Jetpack_Sync_Comments::$max_to_sync - 1 ), $post_ids );
//		$this->assertNotContains( Jetpack_Sync_Comments::$max_to_sync, $post_ids );
//
//
//		$this->assertTrue( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );
//
//		$post_ids = Jetpack_Sync_Comments::get_comment_ids_to_sync();
//
//		$this->assertContains( 0, $post_ids );
//		$this->assertContains( 5, $post_ids );
//
//		Jetpack_Sync::remove_cron();
//		$this->assertFalse( ! ! wp_next_scheduled( Jetpack_Sync::$cron_name ) );
//
//	}
//
//	private function get_new_post_array() {
//		return array(
//			'post_title'   => 'this is the title',
//			'post_content' => 'this is the content',
//			'post_status'  => 'publish',
//			'post_author'  => 1
//		);
//	}
//
//	private function get_new_comment_array() {
//		return array(
//			'comment_post_ID'      => $this->post_id,
//			'comment_author'       => 'admin',
//			'comment_author_email' => 'admin@admin.com',
//			'comment_author_url'   => 'http://',
//			'comment_content'      => 'content here',
//			'comment_type'         => '',
//			'comment_parent'       => 0,
//			'user_id'              => 1,
//			'comment_author_IP'    => '127.0.0.1',
//			'comment_agent'        => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10 (.NET CLR 3.5.30729)',
//			'comment_date'         => current_time( 'mysql' ),
//			'comment_approved'     => 1,
//		);
//	}
//
//	private function add_new_comment() {
//		$comment_array               = self::get_new_comment_array();
//		$comment_id                  = wp_insert_comment( $comment_array );
//		Jetpack_Sync_Comments::$sync = array();
//
//		return $comment_id;
//	}
//
//	private function reset() {
//		Jetpack_Sync_Comments::$sync   = array();
//		Jetpack_Sync_Comments::$delete = array();
//		Jetpack_Sync::$do_shutdown = false;
//	}
//
//}
