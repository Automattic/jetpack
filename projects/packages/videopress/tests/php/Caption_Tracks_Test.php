<?php
/**
 * Tests for VideoPress caption tracks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Test suite for caption track CPT and REST routes.
 */
class Caption_Tracks_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Author user ID. Owns the video the caption track belongs to.
	 *
	 * @var int
	 */
	private $author_id;

	/**
	 * A second author who does not own the video.
	 *
	 * @var int
	 */
	private $other_author_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		require_once __DIR__ . '/../../src/utility-functions.php';

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Caption_Tracks::init();
		Caption_Tracks::register_post_type();
		Caption_Tracks::register_meta();
		Rest_Controller::init();
		do_action( 'rest_api_init' );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'caption_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		$this->author_id = wp_insert_user(
			array(
				'user_login' => 'caption_author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);

		$this->other_author_id = wp_insert_user(
			array(
				'user_login' => 'caption_other_author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'caption_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests that the caption track post type is private and not exposed via core REST.
	 *
	 * Caption tracks are reached only through the custom REST routes, which
	 * authorize each request against the video it targets.
	 */
	public function test_post_type_is_private_and_not_rest_exposed() {
		$post_type = get_post_type_object( Caption_Tracks::POST_TYPE );

		$this->assertNotFalse( $post_type );
		$this->assertFalse( $post_type->public );
		$this->assertFalse( $post_type->show_ui );
		$this->assertFalse( $post_type->show_in_rest );
	}

	/**
	 * Tests manual language canonicalization.
	 */
	public function test_manual_language_is_canonicalized() {
		$this->assertSame( 'pt-BR', Caption_Tracks::sanitize_manual_language( 'pt-br' ) );
		$this->assertSame( 'zh-Hant-TW', Caption_Tracks::sanitize_manual_language( 'zh-hant-tw' ) );
	}

	/**
	 * Tests that generated language keys are rejected for manual caption track language.
	 */
	public function test_generated_language_keys_are_rejected_for_manual_language() {
		$this->assertSame( '', Caption_Tracks::sanitize_manual_language( 'auto_en' ) );
	}

	/**
	 * Tests that users without video access cannot save caption tracks.
	 */
	public function test_caption_track_save_denied_without_video_access() {
		wp_set_current_user( $this->subscriber_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params( $this->track_payload() );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests that a user who can edit the video can save its caption tracks.
	 */
	public function test_caption_track_save_authorized_by_video_edit_access() {
		$guid = 'vid01234';
		$this->create_videopress_attachment( $guid, $this->author_id );

		wp_set_current_user( $this->author_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params( $this->track_payload_for_guid( $guid ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $guid, get_post_meta( $response->get_data()['id'], Caption_Tracks::META_GUID, true ) );
	}

	/**
	 * Tests that holding `upload_files` is not enough to edit another user's video captions.
	 *
	 * The second author can upload videos, but cannot edit a video owned by the
	 * first author, so saving its caption tracks must be denied.
	 */
	public function test_caption_track_save_denied_for_user_without_video_edit_access() {
		$guid = 'vid05678';
		$this->create_videopress_attachment( $guid, $this->author_id );

		wp_set_current_user( $this->other_author_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params( $this->track_payload_for_guid( $guid ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests saving a caption track through REST.
	 */
	public function test_caption_track_can_be_saved_as_draft() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params( $this->track_payload() );

		$response = $this->server->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( Caption_Tracks::POST_TYPE, get_post_type( $data['id'] ) );
		$this->assertSame( 'draft', get_post_status( $data['id'] ) );
		$this->assertSame( 'pt-BR', get_post_meta( $data['id'], Caption_Tracks::META_SRC_LANG, true ) );
		$this->assertSame( 'auto_en', get_post_meta( $data['id'], Caption_Tracks::META_SOURCE_TRACK_SRC_LANG, true ) );
	}

	/**
	 * Tests saving a published caption track through REST.
	 */
	public function test_caption_track_can_be_saved_as_publish() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params(
			array_merge(
				$this->track_payload(),
				array(
					'status' => 'publish',
				)
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', get_post_status( $data['id'] ) );
		$this->assertSame( 'publish', $data['status'] );
	}

	/**
	 * Tests updating an existing caption track from draft to published.
	 */
	public function test_caption_track_can_be_updated_from_draft_to_publish() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$update_request = new WP_REST_Request( 'PUT', '/jetpack/v4/videopress/caption-tracks/' . $created['id'] );
		$update_request->set_body_params(
			array_merge(
				$this->track_payload(),
				array(
					'content' => '<!-- wp:videopress/caption-cue {"startTime":"00:00:01.000","endTime":"00:00:03.000","text":"Updated"} /-->',
					'status'  => 'publish',
				)
			)
		);

		$response = $this->server->dispatch( $update_request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', get_post_status( $created['id'] ) );
		$this->assertStringContainsString( 'Updated', $data['content'] );
	}

	/**
	 * Tests deleting a caption track through REST.
	 */
	public function test_caption_track_can_be_deleted() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$delete_request = new WP_REST_Request( 'DELETE', '/jetpack/v4/videopress/caption-tracks/' . $created['id'] );
		$response       = $this->server->dispatch( $delete_request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['deleted'] );
		$this->assertNull( get_post( $created['id'] ) );
	}

	/**
	 * Tests that deleting a caption track is denied without video edit access.
	 */
	public function test_caption_track_delete_denied_without_video_access() {
		$guid = 'vid05678';
		$this->create_videopress_attachment( $guid, $this->author_id );
		wp_set_current_user( $this->author_id );

		$create_request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload_for_guid( $guid ) );
		$created = $this->server->dispatch( $create_request )->get_data();

		wp_set_current_user( $this->other_author_id );

		$delete_request = new WP_REST_Request( 'DELETE', '/jetpack/v4/videopress/caption-tracks/' . $created['id'] );
		$response       = $this->server->dispatch( $delete_request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertInstanceOf( \WP_Post::class, get_post( $created['id'] ) );
	}

	/**
	 * Tests that `upload_files` alone cannot save captions for a GUID with no local video.
	 *
	 * Where the resolver is available, a GUID that has no local attachment is
	 * denied rather than falling back to the broad upload capability.
	 */
	public function test_caption_track_save_denied_for_unresolvable_guid() {
		wp_set_current_user( $this->author_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$request->set_body_params( $this->track_payload_for_guid( 'novideo1' ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests that updating a track cannot reassign it to a different video.
	 *
	 * The GUID is pinned to the video the track already belongs to, so a GUID
	 * supplied on update is ignored.
	 */
	public function test_caption_track_update_cannot_reassign_guid() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$update_request = new WP_REST_Request( 'PUT', '/jetpack/v4/videopress/caption-tracks/' . $created['id'] );
		$update_request->set_body_params( $this->track_payload_for_guid( 'zzzz9999' ) );

		$response = $this->server->dispatch( $update_request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'abcd1234', get_post_meta( $created['id'], Caption_Tracks::META_GUID, true ) );
	}

	/**
	 * Create a VideoPress attachment for a GUID, owned by a given user.
	 *
	 * @param string $guid      VideoPress GUID.
	 * @param int    $author_id Attachment author.
	 * @return int Attachment ID.
	 */
	private function create_videopress_attachment( $guid, $author_id ) {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
				'post_author'    => $author_id,
			)
		);

		update_post_meta( $attachment_id, 'videopress_guid', $guid );

		/*
		 * videopress_get_post_by_guid() resolves the GUID with a WP_Query that the
		 * WorDBless test database does not support, so prime its cache directly to
		 * keep the permission check deterministic.
		 */
		wp_cache_set( 'get_post_by_guid_' . $guid, get_post( $attachment_id ), 'videopress' );

		return $attachment_id;
	}

	/**
	 * Caption track payload targeting a specific GUID.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return array
	 */
	private function track_payload_for_guid( $guid ) {
		$payload                                      = $this->track_payload();
		$payload['meta'][ Caption_Tracks::META_GUID ] = $guid;

		return $payload;
	}

	/**
	 * Default caption track payload.
	 *
	 * @return array
	 */
	private function track_payload() {
		return array(
			'title'   => 'Portuguese captions',
			'content' => '<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000","text":"Hello"} /-->',
			'status'  => 'draft',
			'meta'    => array(
				Caption_Tracks::META_GUID                  => 'abcd1234',
				Caption_Tracks::META_KIND                  => 'captions',
				Caption_Tracks::META_SRC_LANG              => 'pt-br',
				Caption_Tracks::META_LABEL                 => 'Portuguese',
				Caption_Tracks::META_SOURCE_TRACK_KIND     => 'captions',
				Caption_Tracks::META_SOURCE_TRACK_SRC_LANG => 'auto_en',
				Caption_Tracks::META_SOURCE_TRACK_SRC      => 'https://example.com/auto.vtt',
			),
		);
	}
}
