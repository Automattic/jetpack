<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Attachment_Handler
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Class Attachment_Handler_Test
 */
class Attachment_Handler_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		\WorDBless\Posts::init()->clear_all_posts();
		parent::tear_down();
	}

	/**
	 * Create a user with the given role and set as current user.
	 *
	 * @param string $role   The user role.
	 * @param string $suffix Unique suffix for the login/email, so the same role can be created more than once.
	 * @return int The new user ID.
	 */
	private function set_current_user_role( $role, $suffix = '_user' ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . $suffix,
				'user_pass'  => 'pass',
				'user_email' => $role . $suffix . '@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Test that prepare_attachment_for_js includes videopress_status when set.
	 */
	public function test_prepare_attachment_for_js_includes_videopress_status() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_guid', 'abc123' );
		add_post_meta( $post_id, 'videopress_status', 'processing' );

		$post   = array(
			'id'   => $post_id,
			'type' => 'video',
		);
		$result = Attachment_Handler::prepare_attachment_for_js( $post );

		$this->assertSame( 'abc123', $result['videopress_guid'] );
		$this->assertSame( 'processing', $result['videopress_status'] );
	}

	/**
	 * Test that prepare_attachment_for_js omits videopress_status when empty.
	 */
	public function test_prepare_attachment_for_js_omits_empty_videopress_status() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_guid', 'abc123' );

		$post   = array(
			'id'   => $post_id,
			'type' => 'video',
		);
		$result = Attachment_Handler::prepare_attachment_for_js( $post );

		$this->assertSame( 'abc123', $result['videopress_guid'] );
		$this->assertArrayNotHasKey( 'videopress_status', $result );
	}

	/**
	 * Test that prepare_attachment_for_js skips non-video attachments.
	 */
	public function test_prepare_attachment_for_js_skips_non_video() {
		$post = array(
			'id'   => 1,
			'type' => 'image',
		);

		$result = Attachment_Handler::prepare_attachment_for_js( $post );

		$this->assertArrayNotHasKey( 'videopress_guid', $result );
		$this->assertArrayNotHasKey( 'videopress_status', $result );
	}

	/**
	 * Test that enqueue_media_library_poll registers the script.
	 */
	public function test_enqueue_media_library_poll_registers_script() {
		Attachment_Handler::enqueue_media_library_poll();

		$this->assertTrue( wp_script_is( 'videopress-media-library-poll', 'enqueued' ) );
	}

	/**
	 * Test that enqueue_media_library_styles adds inline CSS to media-views.
	 */
	public function test_enqueue_media_library_styles_adds_inline_css() {
		wp_register_style( 'media-views', false, array(), '1.0' );

		Attachment_Handler::enqueue_media_library_styles();

		$data = wp_styles()->get_data( 'media-views', 'after' );
		$this->assertIsArray( $data );
		$this->assertStringContainsString( 'max-width: 100%', $data[0] );
		$this->assertStringContainsString( 'max-height: 100%', $data[0] );

		wp_deregister_style( 'media-views' );
	}

	/**
	 * Test that heartbeat_settings lowers the minimal interval.
	 */
	public function test_heartbeat_settings_lowers_minimal_interval() {
		$settings = Attachment_Handler::heartbeat_settings( array() );

		$this->assertSame( 5, $settings['minimalInterval'] );
	}

	/**
	 * Test that heartbeat_received returns statuses for requested IDs.
	 */
	public function test_heartbeat_received_returns_statuses() {
		$this->set_current_user_role( 'author' );
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_status', 'complete' );

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( $post_id ) )
		);

		$this->assertArrayHasKey( 'videopress_processing_status', $result );
		$this->assertSame( 'complete', $result['videopress_processing_status'][ $post_id ] );
	}

	/**
	 * Test that heartbeat_received returns unchanged response when no IDs provided.
	 */
	public function test_heartbeat_received_ignores_missing_ids() {
		$result = Attachment_Handler::heartbeat_received( array( 'existing' => true ), array() );

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
		$this->assertTrue( $result['existing'] );
	}

	/**
	 * Test that heartbeat_received rejects non-array IDs.
	 */
	public function test_heartbeat_received_rejects_non_array_ids() {
		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => 'not-an-array' )
		);

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
	}

	/**
	 * Test that heartbeat_received casts IDs to integers.
	 */
	public function test_heartbeat_received_casts_ids_to_int() {
		$this->set_current_user_role( 'author' );
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_status', 'processing' );

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( (string) $post_id ) )
		);

		$this->assertArrayHasKey( $post_id, $result['videopress_processing_status'] );
		$this->assertSame( 'processing', $result['videopress_processing_status'][ $post_id ] );
	}

	/**
	 * Test that heartbeat_received omits IDs with no status meta.
	 */
	public function test_heartbeat_received_omits_ids_without_status() {
		$this->set_current_user_role( 'author' );
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( $post_id ) )
		);

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
	}

	/**
	 * Test that heartbeat_received does not expose status to a user who cannot
	 * edit the attachment.
	 *
	 * Without a capability check any logged-in user (e.g. a subscriber) could
	 * enumerate the processing status of arbitrary attachments by supplying
	 * their IDs.
	 */
	public function test_heartbeat_received_skips_attachments_user_cannot_edit() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_status', 'processing' );

		$this->set_current_user_role( 'subscriber' );

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( $post_id ) )
		);

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
	}

	/**
	 * Test that heartbeat_received does not expose another user's attachment
	 * status to an author who cannot edit it.
	 *
	 * This is the core IDOR guard: a logged-in author with upload permissions
	 * must not be able to read the processing status of attachments belonging
	 * to other users.
	 */
	public function test_heartbeat_received_skips_other_users_attachments() {
		$owner_id = $this->set_current_user_role( 'author', '_owner' );

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => "Owner's video",
				'post_author'    => $owner_id,
			)
		);
		add_post_meta( $post_id, 'videopress_status', 'processing' );

		$this->set_current_user_role( 'author' );

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( $post_id ) )
		);

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
	}

	/**
	 * Test that heartbeat_received returns no status for a logged-out user.
	 */
	public function test_heartbeat_received_requires_logged_in_user() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);
		add_post_meta( $post_id, 'videopress_status', 'processing' );

		wp_set_current_user( 0 );

		$result = Attachment_Handler::heartbeat_received(
			array(),
			array( 'videopress_processing_ids' => array( $post_id ) )
		);

		$this->assertArrayNotHasKey( 'videopress_processing_status', $result );
	}

	/**
	 * Test that disable_delete_if_disconnected handles an empty $args array.
	 *
	 * The `user_has_cap` filter can invoke the callback with an empty $args
	 * array (e.g. for capability checks made without an object). Reading
	 * $args[0] unconditionally previously raised an "Undefined array key 0"
	 * warning. The capabilities should be returned unchanged.
	 */
	public function test_disable_delete_if_disconnected_ignores_empty_args() {
		$allcaps = array( 'delete_posts' => true );

		$result = Attachment_Handler::disable_delete_if_disconnected( $allcaps, array( 'delete_posts' ), array() );

		$this->assertSame( $allcaps, $result );
	}

	/**
	 * Test that disable_delete_if_disconnected handles a delete_post check made
	 * without an object ID.
	 *
	 * `current_user_can( 'delete_post' )` can be called without a post ID, so
	 * $args[2] (the object ID) may be unset. Reading it unconditionally would
	 * raise an "Undefined array key 2" warning. The capabilities should be
	 * returned unchanged.
	 */
	public function test_disable_delete_if_disconnected_ignores_missing_object_id() {
		$allcaps = array( 'delete_posts' => true );

		$result = Attachment_Handler::disable_delete_if_disconnected( $allcaps, array( 'delete_post' ), array( 'delete_post' ) );

		$this->assertSame( $allcaps, $result );
	}
}
