<?php

use Automattic\Jetpack\Sync\Modules;

/**
 * Testing CRUD on Comments
 *
 * @group jetpack-sync
 */
class WP_Test_Jetpack_Sync_Comments extends WP_Test_Jetpack_Sync_Base {

	protected $comment;
	protected $post_id;
	protected $comment_ids;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->post_id     = self::factory()->post->create();
		$this->comment_ids = self::factory()->comment->create_post_comments( $this->post_id );
		$this->comment     = get_comment( $this->comment_ids[0] );

		$this->sender->do_sync();
	}

	public function test_add_comment_syncs_event() {

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );

		$this->assertNotFalse( $event );
		$this->assertEquals( 'wp_insert_comment', $event->action );
		$this->assertEquals( $this->comment->comment_ID, $event->args[0] );
		$this->assertEqualsObject( $this->comment, $event->args[1], 'Synced comment does not match local comment' );
	}

	public function test_add_comment_syncs_comment_data() {
		// post stored by server should equal post in client
		$this->assertSame( 1, $this->server_replica_storage->comment_count() );
		$this->assertEqualsObject( $this->comment, $this->server_replica_storage->get_comment( $this->comment->comment_ID ), 'Synced comment does not match local comment' );
	}

	public function test_update_comment() {
		$this->comment->comment_content = 'foo bar baz';

		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );

		$this->assertEquals( 'foo bar baz', $remote_comment->comment_content );
	}

	public function test_unapprove_comment_does_not_trigger_content_modified_event() {
		$this->comment->comment_approved = 0;
		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_modified_comment_contents' );
		$this->assertFalse( (bool) $event );
	}

	public function test_modify_comment_content() {
		$comment                  = clone $this->comment;
		$comment->comment_content = "Heeeeeeere's Johnny!";
		$expected_variable        = array(
			'comment_content' => array(
				$comment->comment_content,
				$this->comment->comment_content,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_do_not_sync_comment_with_unknown_comment_type() {
		$this->server_event_storage->reset();
		$comment_data = array(
			'comment_post_ID'  => $this->post_id,
			'comment_date'     => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_date_gmt' => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_author'   => 'ActionScheduler',
			'comment_content'  => 'fun!',
			'comment_agent'    => 'ActionScheduler',
			'comment_type'     => 'action_log',
		);
		wp_insert_comment( $comment_data );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );
		$this->assertFalse( $event );
	}

	public function test_do_sync_comments_with_known_comment_types() {
		$this->server_event_storage->reset();
		add_filter( 'jetpack_sync_whitelisted_comment_types', array( $this, 'add_custom_comment_type' ) );

		$comment_data = array(
			'comment_post_ID'  => $this->post_id,
			'comment_date'     => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_date_gmt' => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_author'   => 'fun author',
			'comment_content'  => 'fun!',
			'comment_agent'    => 'fun things!',
			'comment_type'     => 'product_feedback', // This should be whitelisted in the filter.
		);
		wp_insert_comment( $comment_data );
		$this->sender->do_sync();
		remove_filter( 'jetpack_sync_whitelisted_comment_types', array( $this, 'add_custom_comment_type' ) );

		$event = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );
		$this->assertNotFalse( $event ); // This should be something other then false.
		$this->assertEquals( 'product_feedback', $event->args[1]->comment_type );
	}

	public function test_modify_comment_author() {
		$comment                 = clone $this->comment;
		$comment->comment_author = 'jollycoder';
		$expected_variable       = array(
			'comment_author' => array(
				$comment->comment_author,
				$this->comment->comment_author,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_author_url() {
		$comment                     = clone $this->comment;
		$comment->comment_author_url = 'http://jollycoder.xyz';
		$expected_variable           = array(
			'comment_author_url' => array(
				$comment->comment_author_url,
				$this->comment->comment_author_url,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_author_email() {
		$comment                       = clone $this->comment;
		$comment->comment_author_email = 'i_prefer_to_remain_anonymous_thanks@example.com';

		$expected_variable = array(
			'comment_author_email' => array(
				$comment->comment_author_email,
				$this->comment->comment_author_email,
			),
		);
		$this->modify_comment_helper( $comment, $expected_variable );
	}

	public function test_modify_comment_multiple_attributes() {
		$comment                       = clone $this->comment;
		$comment->comment_author_email = 'i_prefer_to_remain_anonymous_thanks@example.com';
		$comment->comment_author_url   = 'http://jollycoder.xyz';
		$comment->comment_author       = 'jollycoder';
		$expected_variable             = array(
			'comment_author_email' => array(
				$comment->comment_author_email,
				$this->comment->comment_author_email,
			),
			'comment_author_url'   => array(
				$comment->comment_author_url,
				$this->comment->comment_author_url,
			),
			'comment_author'       => array(
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

		// Confirm that 'modified_comment_contents' action is not set after updating comment with same data
		wp_update_comment( (array) $comment );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_modified_comment_contents' );
		$this->assertFalse( (bool) $event );
	}

	public function test_unapprove_comment() {
		$comment_action_name = 'comment_unapproved_comment';

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->comment->comment_approved = 0;
		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		// Test both sync actions we're expecting
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$remote_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );
		$this->assertSame( '0', $remote_comment->comment_approved );
		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( $comment_action_name );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertTrue( (bool) $comment_approved_to_unapproved_event );

		// Test both sync actions again, this time without causing a change in state (comment_unapproved_ remains true despite no state change, while comment_approved_to_unapproved does not)

		$this->server_event_storage->reset();

		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( $comment_action_name );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertFalse( (bool) $comment_approved_to_unapproved_event );
	}

	public function test_trash_comment_trashes_data() {
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		wp_delete_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_delete_comment_deletes_data() {
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );

		wp_delete_comment( $this->comment->comment_ID, true );

		$this->sender->do_sync();

		// there should be no comments at all
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_wp_trash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		// Test that you don't get an event back when you try to trash the same comment again
		$this->server_event_storage->reset();
		wp_trash_comment( $this->comment->comment_ID );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'trashed_comment' );
		$this->assertFalse( $event );
	}

	public function test_wp_untrash_comment() {
		wp_trash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'trash' ) );

		wp_untrash_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'untrashed_comment' );
		$this->assertEquals( 'untrashed_comment', $event->action );

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'trash' ) );
	}

	public function test_sync_comment_jetpack_sync_prevent_sending_comment_data_filter() {
		add_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );

		$this->server_replica_storage->reset();
		$this->comment->comment_content = 'foo bar baz';

		wp_update_comment( (array) $this->comment );

		$this->sender->do_sync();

		remove_filter( 'jetpack_sync_prevent_sending_comment_data', '__return_true' );

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'jetpack_sync_blocked' ) );

		$insert_comment_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_comment' );
		$comment              = $insert_comment_event->args[1];

		$this->assertEquals( $this->comment->comment_ID, $comment->comment_ID );
		$this->assertTrue( strtotime( $this->comment->comment_date ) <= strtotime( $comment->comment_date ) );
		$this->assertTrue( strtotime( $this->comment->comment_date_gmt ) <= strtotime( $comment->comment_date_gmt ) );
		$this->assertEquals( 'jetpack_sync_blocked', $comment->comment_approved );
		$this->assertFalse( isset( $comment->comment_content ) );

		// Since the filter is not there any more the sync should happen as expected.
		$this->comment->comment_content = 'foo bar baz';
		wp_update_comment( (array) $this->comment );
		$this->sender->do_sync();

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$synced_comment = $this->server_replica_storage->get_comment( $this->comment->comment_ID );
		$this->assertEquals( $this->comment->comment_content, $synced_comment->comment_content );
	}

	public function test_wp_spam_comment() {
		wp_spam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'spam' ) );
	}

	public function test_wp_unspam_comment() {
		wp_spam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'spam' ) );

		wp_unspam_comment( $this->comment->comment_ID );

		$this->sender->do_sync();

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'spam' ) );

		$event = $this->server_event_storage->get_most_recent_event( 'unspammed_comment' );
		$this->assertEquals( 'unspammed_comment', $event->action );
	}

	public function test_post_trashed_comment_handling() {
		wp_trash_post( $this->post_id );

		$this->sender->do_sync();
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'post-trashed' ) );
	}

	public function test_post_untrashed_comment_handling() {
		wp_trash_post( $this->post_id );
		$this->sender->do_sync();

		wp_untrash_post( $this->post_id );
		$this->sender->do_sync();

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
	}

	public function test_returns_comment_object_by_id() {
		$comment_sync_module = Modules::get_module( 'comments' );

		$comment_id = $this->comment_ids[0];

		// get the synced object
		$event          = $this->server_event_storage->get_most_recent_event( 'wp_insert_comment' );
		$synced_comment = $event->args[1];

		// grab the codec - we need to simulate the stripping of types that comes with encoding/decoding
		$codec = $this->sender->get_codec();

		$retrieved_comment = $codec->decode(
			$codec->encode(
				$comment_sync_module->get_object_by_id( 'comment', $comment_id )
			)
		);

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

	/*
	 * Verify Whitelist is applied to all actions.
	 */

	/**
	 * Helper function to generate unknown comment data.
	 *
	 * @param string $comment_type comment_type of generated comment.
	 *
	 * @return false|int Comment ID or false if failure.
	 */
	private function generate_unknown_comment( $comment_type = 'action_log' ) {
		$comment_data = array(
			'comment_post_ID'  => $this->post_id,
			'comment_date'     => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_date_gmt' => gmdate( 'Y-m-d H:i:s', time() ),
			'comment_author'   => 'ActionScheduler',
			'comment_content'  => 'fun!',
			'comment_agent'    => 'ActionScheduler',
			'comment_type'     => $comment_type,
		);

		$comment_id = wp_insert_comment( $comment_data );

		return $comment_id;
	}

	/**
	 * Test that `*_comment_meta` actions are sent for known comment types and meta.
	 */
	public function test_sync_comment_meta_known() {

		add_comment_meta( $this->comment->comment_ID, 'hc_avatar', 'red' );
		update_comment_meta( $this->comment->comment_ID, 'hc_avatar', 'blue' );
		delete_comment_meta( $this->comment->comment_ID, 'hc_avatar' );
		$this->sender->do_sync();

		$added_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'added_comment_meta' );
		$this->assertEquals( 'added_comment_meta', $added_comment_meta_event->action );

		$updated_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'updated_comment_meta' );
		$this->assertEquals( 'updated_comment_meta', $updated_comment_meta_event->action );

		$deleted_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'deleted_comment_meta' );
		$this->assertEquals( 'deleted_comment_meta', $deleted_comment_meta_event->action );

	}

	/**
	 * Test that `*_comment_meta` actions are not sent for known comment types and unknown meta.
	 */
	public function test_sync_comment_meta_unknown_meta() {

		add_comment_meta( $this->comment->comment_ID, 'gobble', 'red' );
		update_comment_meta( $this->comment->comment_ID, 'gobble', 'blue' );
		delete_comment_meta( $this->comment->comment_ID, 'gobble' );
		$this->sender->do_sync();

		$added_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'added_comment_meta' );
		$this->assertFalse( $added_comment_meta_event );

		$updated_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'updated_comment_meta' );
		$this->assertFalse( $updated_comment_meta_event );

		$deleted_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'deleted_comment_meta' );
		$this->assertFalse( $deleted_comment_meta_event );

	}

	/**
	 * Test that `*_comment_meta` actions are not sent for unknown comment types.
	 */
	public function test_sync_comment_meta_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		add_comment_meta( $comment_id, 'hc_avatar', 'red' );
		update_comment_meta( $comment_id, 'hc_avatar', 'blue' );
		delete_comment_meta( $comment_id, 'hc_avatar' );
		$this->sender->do_sync();

		$added_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'added_comment_meta' );
		$this->assertFalse( $added_comment_meta_event );

		$updated_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'updated_comment_meta' );
		$this->assertFalse( $updated_comment_meta_event );

		$deleted_comment_meta_event = $this->server_event_storage->get_most_recent_event( 'deleted_comment_meta' );
		$this->assertFalse( $deleted_comment_meta_event );
	}

	/**
	 * Test that `trashed_comment` actions are not sent for unknown comment types.
	 */
	public function test_wp_trash_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		$this->sender->do_sync();

		wp_trash_comment( $comment_id );

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'trashed_comment' );
		$this->assertFalse( $event );
	}

	/**
	 * Test that `untrashed_comment` actions are not sent for unknown comment types.
	 */
	public function test_wp_untrash_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		wp_trash_comment( $comment_id );
		wp_untrash_comment( $comment_id );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'untrashed_comment' );
		$this->assertFalse( $event );
	}

	/**
	 * Test that `spammed_comment` actions are not sent for unknown comment types.
	 */
	public function test_wp_spam_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		$this->sender->do_sync();
		wp_spam_comment( $comment_id );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'spammed_comment' );
		$this->assertFalse( $event );
	}

	/**
	 * Test that `unspammed_comment` actions are not sent for unknown comment types.
	 */
	public function test_wp_unspam_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		wp_spam_comment( $comment_id );
		wp_unspam_comment( $comment_id );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'unspammed_comment' );
		$this->assertFalse( $event );
	}

	/**
	 * Test that `deleted_comment` actions are not sent for unknown comment types.
	 */
	public function test_delete_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		wp_delete_comment( $comment_id, true );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'deleted_comment' );
		$this->assertFalse( $event );
	}

	/**
	 * Test that `comment_approved_to_unapproved` and `comment_unapproved_to_approved` actions are not sent for unknown comment types.
	 */
	public function test_transition_comment_unknown_type() {
		$this->server_event_storage->reset();

		$comment_id = $this->generate_unknown_comment();
		$comment    = get_comment( $comment_id );

		$comment->comment_approved = 0;
		wp_update_comment( (array) $comment );

		$this->sender->do_sync();

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertFalse( $comment_approved_to_unapproved_event );

		$this->server_event_storage->reset();

		$comment->comment_approved = 1;
		wp_update_comment( (array) $comment );
		$this->sender->do_sync();

		$comment_unapproved_to_approved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_to_approved' );
		$this->assertFalse( $comment_unapproved_to_approved_event );
	}

	/**
	 * Test that `trashed_post_comments` and `untrashed_post_comments` are not sent for blacklisted post_types.
	 */
	public function test_post_comments_blacklisted_post_type() {
		$args = array(
			'public' => true,
			'label'  => 'Snitch',
		);
		register_post_type( 'snitch', $args );

		$post_id = self::factory()->post->create( array( 'post_type' => 'snitch' ) );
		self::factory()->comment->create_post_comments( $post_id );

		$this->sender->do_sync();
		$this->server_event_storage->reset();

		// Trash unknown post_type comments.
		wp_trash_post_comments( $post_id );
		$this->sender->do_sync();

		$trashed_post_comments_event = $this->server_event_storage->get_most_recent_event( 'trashed_post_comments' );
		$this->assertFalse( $trashed_post_comments_event );

		// Untrash unknown post_type comments.
		wp_untrash_post_comments( $post_id );
		$this->sender->do_sync();

		$untrash_post_comments_event = $this->server_event_storage->get_most_recent_event( 'untrash_post_comments' );
		$this->assertFalse( $untrash_post_comments_event );
	}

}
