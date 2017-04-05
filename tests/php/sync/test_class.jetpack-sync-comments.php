<?php

/**
 * Testing CRUD on Comments
 */
class WP_Test_Jetpack_Sync_Comments extends WP_Test_Jetpack_Sync_Base {

	protected $comment;
	protected $post_id;
	protected $comment_ids;

	public function setUp() {
		parent::setUp();

		$this->post_id = $this->factory->post->create();
		$this->comment_ids = $this->factory->comment->create_post_comments( $this->post_id );
		$this->comment = get_comment( $this->comment_ids[0] );

		$this->sender->do_sync();
	}

	public function test_add_comment_syncs_event() {

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );

		$this->assertNotEquals( false, $event );
		$this->assertEquals( 'wp_insert_comment', $event->action );
		$this->assertEquals( $this->comment->comment_ID, $event->args[0] );
		$this->assertEqualsObject( $this->comment, $event->args[1] );
	}

	public function test_add_comment_syncs_comment_data() {
		// post stored by server should equal post in client
		$this->assertEquals( 1, $this->server_replica_storage->comment_count() );
		$this->assertEqualsObject( $this->comment, $this->server_replica_storage->get_comment( $this->comment->comment_ID ) );
	}

	public function test_update_comment() {
		$this->comment->comment_content = "foo bar baz";

		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );

		$this->assertEquals( "foo bar baz", $remote_comment->comment_content );
	}

	public function test_trash_comment_trashes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		wp_delete_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_delete_comment_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment->comment_ID, true );

		$this->sender->do_sync();

		// there should be no comments at all
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_wp_trash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_wp_untrash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		wp_untrash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	function test_sync_comment_jetpack_sync_prevent_sending_comment_data_filter() {
		add_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );

		$this->server_replica_storage->reset();
		$this->comment->comment_content = "foo bar baz";

		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		remove_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'jetpack_sync_blocked' ) );

		$insert_comment_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_' );
		$comment              = $insert_comment_event->args[1];

		$this->assertEquals( $this->comment->comment_ID, $comment->comment_ID );
		$this->assertTrue( strtotime( $this->comment->comment_date ) <= strtotime( $comment->comment_date ) );
		$this->assertTrue( strtotime( $this->comment->comment_date_gmt ) <= strtotime( $comment->comment_date_gmt ) );
		$this->assertEquals( 'jetpack_sync_blocked', $comment->comment_approved );
		$this->assertFalse( isset( $comment->comment_content ) );

		// Since the filter is not there any more the sync should happen as expected.
		$this->comment->comment_content = "foo bar baz";
		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$synced_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );
		$this->assertEquals( $this->comment->comment_content, $synced_comment->comment_content );
	}

	public function test_wp_spam_comment() {
		wp_spam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'spam' ) );
	}

	public function test_post_trashed_comment_handling() {
		wp_trash_post( $this->post_id );

		$this->sender->do_sync();
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'post-trashed' ) );
	}

	public function test_post_untrashed_comment_handling() {
		wp_trash_post( $this->post_id );
		$this->sender->do_sync();

		wp_untrash_post( $this->post_id );
		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_returns_comment_object_by_id() {
		$comment_sync_module = Jetpack_Sync_Modules::get_module( "comments" );

		$comment_id = $this->comment_ids[0];
		
		// get the synced object
		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );
		$synced_comment = $event->args[1];

		// grab the codec - we need to simulate the stripping of types that comes with encoding/decoding
		$codec = $this->sender->get_codec();

		$retrieved_comment = $codec->decode( $codec->encode(
			$comment_sync_module->get_object_by_id( 'comment', $comment_id )
		) );

		$this->assertEquals( $synced_comment, $retrieved_comment );
	}
}
