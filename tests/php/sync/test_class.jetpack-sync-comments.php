<?php

use Automattic\Jetpack\Sync\Modules;

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

	public function test_unapprove_comment_does_not_trigger_content_modified_event() {
		$this->comment->comment_approved = 0;
		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_modified_comment_contents' );
		$this->assertFalse( (bool) $event );
	}

	public function test_modify_comment_content() {
		global $wp_version;
		if ( version_compare( $wp_version, 4.7, '<' ) ) {
			$this->markTestSkipped( 'WP 4.7 and up supports required wp_update_comment_data filter' );
			return;
		}

		$comment = clone $this->comment;
		$comment->comment_content = "Heeeeeeere's Johnny!";
		$expected_variable = array(
			'comment_content' => array(
				$comment->comment_content,
				$this->comment->comment_content,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_author() {
		global $wp_version;
		if ( version_compare( $wp_version, 4.7, '<' ) ) {
			$this->markTestSkipped( 'WP 4.7 and up supports required wp_update_comment_data filter' );
			return;
		}

		$comment = clone $this->comment;
		$comment->comment_author = "jollycoder";
		$expected_variable = array(
			'comment_author' => array(
				$comment->comment_author,
				$this->comment->comment_author,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_author_url() {
		global $wp_version;
		if ( version_compare( $wp_version, 4.7, '<' ) ) {
			$this->markTestSkipped( 'WP 4.7 and up supports required wp_update_comment_data filter' );
			return;
		}

		$comment = clone $this->comment;
		$comment->comment_author_url = "http://jollycoder.xyz";
		$expected_variable = array(
			'comment_author_url' => array(
				$comment->comment_author_url,
				$this->comment->comment_author_url,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_author_email() {
		global $wp_version;
		if ( version_compare( $wp_version, 4.7, '<' ) ) {
			$this->markTestSkipped( 'WP 4.7 and up supports required wp_update_comment_data filter' );
			return;
		}

		$comment = clone $this->comment;
		$comment->comment_author_email = "i_prefer_to_remain_anonymous_thanks@example.com";;
		$expected_variable = array(
			'comment_author_email' => array(
				$comment->comment_author_email,
				$this->comment->comment_author_email,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_multiple_attributes() {
		global $wp_version;
		if ( version_compare( $wp_version, 4.7, '<' ) ) {
			$this->markTestSkipped( 'WP 4.7 and up supports required wp_update_comment_data filter' );
			return;
		}

		$comment = clone $this->comment;
		$comment->comment_author_email = "i_prefer_to_remain_anonymous_thanks@example.com";
		$comment->comment_author_url = "http://jollycoder.xyz";
		$comment->comment_author = "jollycoder";
		$expected_variable = array(
			'comment_author_email' => array(
				$comment->comment_author_email,
				$this->comment->comment_author_email,
			),
			'comment_author_url' => array(
				$comment->comment_author_url,
				$this->comment->comment_author_url,
			),
			'comment_author' => array(
				$comment->comment_author,
				$this->comment->comment_author,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	/*
	 * Updates comment, checks that event args match expected, checks event is not duplicated
	 */
	private function modify_comment_helper( $comment, $expected_variable ) {
		$expected = array(
			$comment->comment_ID,
			$expected_variable,
		);

		wp_update_comment( (array) $comment );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_modified_comment_contents' );
		$this->assertTrue( (bool) $event );
		$this->assertEquals( $expected, $event->args );

		$this->server_event_storage->reset();

		//Confirm that 'modified_comment_contents' action is not set after updating comment with same data
		wp_update_comment( (array) $comment );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_modified_comment_contents' );
		$this->assertFalse( (bool) $event );
	}

	public function test_unapprove_comment() {

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->comment->comment_approved = 0;
		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		//Test both sync actions we're expecting
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );
		$this->assertEquals( 0, $remote_comment->comment_approved );
		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_' );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertTrue( (bool) $comment_approved_to_unapproved_event );

		//Test both sync actions again, this time without causing a change in state (comment_unapproved_ remains true despite no state change, while comment_approved_to_unapproved does not)

		$this->server_event_storage->reset();

		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_' );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertFalse( (bool) $comment_approved_to_unapproved_event );
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

		//Test that you don't get an event back when you try to trash the same comment again
		$this->server_event_storage->reset();
		wp_trash_comment( $this->comment->comment_ID );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'trashed_comment' );
		$this->assertFalse( $event );
	}

	public function test_wp_untrash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		wp_untrash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'untrashed_comment' );
		$this->assertEquals( 'untrashed_comment', $event->action );

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

	public function test_wp_unspam_comment() {
		wp_spam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'spam' ) );

		wp_unspam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertEquals( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertEquals( 0, $this->server_replica_storage->comment_count( 'spam' ) );

		$event = $this->server_event_storage->get_most_recent_event( 'unspammed_comment' );
		$this->assertEquals( 'unspammed_comment', $event->action );
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
		$comment_sync_module = Modules::get_module( "comments" );

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

	/**
	 * @covers Automattic\Jetpack\Sync\Modules\Comments::get_whitelisted_comment_types()
	 */
	public function test_allows_custom_comment_types() {
		$comments_sync_module = Modules::get_module( 'comments' );

		$this->assertNotContains( 'product_feedback', $comments_sync_module->get_whitelisted_comment_types() );

		add_filter( 'jetpack_sync_whitelisted_comment_types', array( $this, 'add_custom_comment_type' ) );

		$this->assertContains( 'product_feedback', $comments_sync_module->get_whitelisted_comment_types() );

		remove_filter( 'jetpack_sync_whitelisted_comment_types', array( $this, 'add_custom_comment_type' ) );
	}

	public function add_custom_comment_type( $comment_types ) {
		$comment_types[] = 'product_feedback';
		return $comment_types;
	}
}
