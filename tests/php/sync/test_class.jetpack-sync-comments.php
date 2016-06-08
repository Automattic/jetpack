<?php

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
		wp_delete_comment( $this->comment->comment_ID );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_delete_comment_deletes_data() {
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment->comment_ID, true );

		$this->client->do_sync();

		// there should be no comments at all
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_wp_trash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_wp_untrash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		wp_untrash_comment( $this->comment->comment_ID );

		$this->client->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_sends_highlander_comment_meta_with_comment() {
		$wpcom_user_id = 101;
		$sig = 'abcd1234';
		$comment_ID = $this->comment->comment_ID;

		add_comment_meta( $comment_ID, 'hc_post_as', 'wordpress', true );
		add_comment_meta( $comment_ID, 'hc_wpcom_id_sig', $sig, true );
		add_comment_meta( $comment_ID, 'hc_foreign_user_id', $wpcom_user_id, true );

		// re-save the comment
		wp_set_comment_status( $comment_ID, 'hold' );

		$this->client->do_sync();
		$this->client->do_sync();

		$event = $this->server_event_storage->get_most_recent_event();

		$synced_comment = $event->args[1];
		$this->assertObjectHasAttribute( 'meta', $synced_comment );
		$this->assertEquals( 'wordpress', $synced_comment->meta['hc_post_as'] );
		$this->assertEquals( 'abcd1234', $synced_comment->meta['hc_wpcom_id_sig'] );
		$this->assertEquals( 101, $synced_comment->meta['hc_foreign_user_id'] );
		
	}

	public function test_wp_spam_comment() {
		wp_spam_comment( $this->comment->comment_ID );

		$this->client->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'spam' ) );
	}
}
