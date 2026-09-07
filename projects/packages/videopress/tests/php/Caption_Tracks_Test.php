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
		new WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks();
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
	 * Tests that well-formed language tags are accepted and kept verbatim.
	 */
	public function test_manual_language_accepts_well_formed_tags() {
		$this->assertSame( 'pt-BR', Caption_Tracks::sanitize_manual_language( 'pt-BR' ) );
		$this->assertSame( 'zh-Hant-TW', Caption_Tracks::sanitize_manual_language( 'zh-Hant-TW' ) );
	}

	/**
	 * Tests that malformed language tags are rejected.
	 */
	public function test_manual_language_rejects_malformed_tags() {
		$this->assertSame( '', Caption_Tracks::sanitize_manual_language( 'not a tag' ) );
		$this->assertSame( '', Caption_Tracks::sanitize_manual_language( 'e' ) );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$update_request = new WP_REST_Request( 'PUT', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
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

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$delete_request = new WP_REST_Request( 'DELETE', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
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

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload_for_guid( $guid ) );
		$created = $this->server->dispatch( $create_request )->get_data();

		wp_set_current_user( $this->other_author_id );

		$delete_request = new WP_REST_Request( 'DELETE', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
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

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
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

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$update_request = new WP_REST_Request( 'PUT', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
		$update_request->set_body_params( $this->track_payload_for_guid( 'zzzz9999' ) );

		$response = $this->server->dispatch( $update_request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'abcd1234', get_post_meta( $created['id'], Caption_Tracks::META_GUID, true ) );
	}

	/**
	 * Tests that listing a video's caption tracks requires edit access to that video.
	 *
	 * Pins the read route to the per-video permission check so one user can't
	 * enumerate another user's captions.
	 *
	 * The per-GUID content isolation (the `meta_key` filter in the query itself)
	 * can't be exercised here: WorDBless stores posts in memory and does not
	 * support meta-filtered WP_Query, so the query returns no rows regardless.
	 * This test therefore covers the authorization boundary, which is the actual
	 * cross-user risk.
	 */
	public function test_list_tracks_denied_without_video_access() {
		$guid = 'vid05678';
		$this->create_videopress_attachment( $guid, $this->author_id );

		wp_set_current_user( $this->other_author_id );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_query_params( array( 'guid' => $guid ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests that saving a caption track with an invalid kind is rejected.
	 *
	 * An unrecognized kind sanitizes to an empty string, which must fail with a
	 * 400 rather than silently storing a track with no kind.
	 */
	public function test_caption_track_save_denied_for_invalid_kind() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload                                      = $this->track_payload();
		$payload['meta'][ Caption_Tracks::META_KIND ] = 'not-a-kind';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Tests that an update omitting `status` keeps a published track published.
	 *
	 * A partial edit (e.g. renaming the label) must not silently unpublish the
	 * track by defaulting the missing status to `draft`.
	 */
	public function test_caption_track_update_without_status_preserves_published_state() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params(
			array_merge( $this->track_payload(), array( 'status' => 'publish' ) )
		);
		$created = $this->server->dispatch( $create_request )->get_data();
		$this->assertSame( 'publish', get_post_status( $created['id'] ) );

		$payload = $this->track_payload();
		unset( $payload['status'] );
		$payload['meta'][ Caption_Tracks::META_LABEL ] = 'Renamed';

		$update_request = new WP_REST_Request( 'PUT', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
		$update_request->set_body_params( $payload );
		$response = $this->server->dispatch( $update_request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'publish', get_post_status( $created['id'] ) );
		$this->assertSame( 'Renamed', get_post_meta( $created['id'], Caption_Tracks::META_LABEL, true ) );
	}

	/**
	 * Tests that stored cue content neutralizes comment/WebVTT terminators and
	 * drops non-cue blocks.
	 *
	 * A direct API call could embed `-->` in cue text to corrupt block parsing or
	 * the WebVTT the track is later serialized to; the terminator must be
	 * neutralized and any block that isn't a caption cue removed.
	 */
	public function test_caption_track_content_is_sanitized() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		/*
		 * The block serializer escapes the `-->` in cue text so the transmitted
		 * markup is well-formed; the terminator only reappears once the JSON is
		 * decoded, which is what the sanitizer neutralizes.
		 */
		$payload            = $this->track_payload();
		$payload['content'] =
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000","text":"Bad \u002d\u002d\u003e cue"} /-->' .
			'<!-- wp:paragraph --><p>Injected</p><!-- /wp:paragraph -->';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		/*
		 * WorDBless doesn't unslash on insert the way core does, so the stored
		 * content comes back slashed; unslash it to read what core would serve.
		 */
		$content = wp_unslash( $this->server->dispatch( $request )->get_data()['content'] );

		$blocks = array_values(
			array_filter(
				parse_blocks( $content ),
				static function ( $block ) {
					return Caption_Tracks::CUE_BLOCK_NAME === $block['blockName'];
				}
			)
		);

		/*
		 * Only the cue block survives, and its decoded text no longer carries the
		 * `-->` terminator that would corrupt downstream WebVTT serialization.
		 */
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'Bad -> cue', $blocks[0]['attrs']['text'] );
		$this->assertStringNotContainsString( 'wp:paragraph', $content );
		$this->assertStringNotContainsString( 'Injected', $content );
	}

	/**
	 * Tests that the `--!>` comment-terminator variant is neutralized too.
	 *
	 * Block comments can be closed with `--!>` as well as `-->`, so both must be
	 * defused to keep stored cue text from corrupting block parsing.
	 */
	public function test_caption_track_content_neutralizes_bang_terminator() {
		$blocks = $this->stored_cue_blocks(
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000","text":"Bad --!> cue"} /-->'
		);

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'Bad -> cue', $blocks[0]['attrs']['text'] );
	}

	/**
	 * Tests that content sanitizing to nothing is stored as an empty string.
	 */
	public function test_caption_track_blank_content_is_stored_empty() {
		$this->assertSame( '', $this->stored_track_content( '   ' ) );
	}

	/**
	 * Tests that a cue block with no `text` attribute survives untouched.
	 *
	 * The terminator neutralization is guarded by an `isset` check, so a cue
	 * missing its text must be kept rather than dropped or error.
	 */
	public function test_caption_track_content_preserves_cue_without_text() {
		$blocks = $this->stored_cue_blocks(
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000"} /-->'
		);

		$this->assertCount( 1, $blocks );
		$this->assertArrayNotHasKey( 'text', $blocks[0]['attrs'] );
		$this->assertSame( '00:00:00.000', $blocks[0]['attrs']['startTime'] );
	}

	/**
	 * Tests that multiple cue blocks are preserved in their original order.
	 */
	public function test_caption_track_content_preserves_cue_order() {
		$blocks = $this->stored_cue_blocks(
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:01.000","text":"First"} /-->' .
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:01.000","endTime":"00:00:02.000","text":"Second"} /-->' .
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:02.000","endTime":"00:00:03.000","text":"Third"} /-->'
		);

		$texts = array_map(
			static function ( $block ) {
				return $block['attrs']['text'];
			},
			$blocks
		);

		$this->assertSame( array( 'First', 'Second', 'Third' ), $texts );
	}

	/**
	 * Tests that updating a track whose stored GUID is empty is denied.
	 *
	 * A malformed track with no GUID can't be authorized against any video, so it
	 * must be denied rather than falling back to the request body's GUID.
	 */
	public function test_caption_track_update_denied_for_empty_guid_track() {
		$track_id = wp_insert_post(
			array(
				'post_type'   => Caption_Tracks::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Orphan track',
			)
		);

		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$update_request = new WP_REST_Request( 'PUT', '/wpcom/v2/videopress/caption-tracks/' . $track_id );
		$update_request->set_body_params( $this->track_payload_for_guid( 'abcd1234' ) );

		$response = $this->server->dispatch( $update_request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests that a backslash in the label survives a REST save round-trip.
	 *
	 * REST params arrive unslashed while the metadata layer unslashes on write,
	 * so an unslashed value would silently lose its literal backslashes.
	 */
	public function test_caption_track_label_preserves_backslashes() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		/*
		 * Exercised via an update: WorDBless's metadata shim unslashes a second
		 * time when first adding a key, which core does not, so only the
		 * existing-key update path mirrors core's single-unslash behavior.
		 */
		$payload                                       = $this->track_payload();
		$payload['meta'][ Caption_Tracks::META_LABEL ] = 'C:\captions\pt';

		$update_request = new WP_REST_Request( 'PUT', '/wpcom/v2/videopress/caption-tracks/' . $created['id'] );
		$update_request->set_body_params( $payload );

		$response = $this->server->dispatch( $update_request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'C:\captions\pt', get_post_meta( $created['id'], Caption_Tracks::META_LABEL, true ) );
	}

	/**
	 * Tests that the route schema rejects a status outside the draft/publish enum.
	 */
	public function test_caption_track_save_rejects_invalid_status() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload           = $this->track_payload();
		$payload['status'] = 'pending';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Tests that the route schema rejects meta keys outside the registered set.
	 */
	public function test_caption_track_save_rejects_unknown_meta_key() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload                        = $this->track_payload();
		$payload['meta']['_wp_smuggle'] = 'value';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Tests that the route schema requires the meta object.
	 */
	public function test_caption_track_save_requires_meta() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload = $this->track_payload();
		unset( $payload['meta'] );
		$payload['guid'] = 'abcd1234';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_missing_callback_param', $response->get_data()['code'] );
	}

	/**
	 * Tests that the route schema rejects non-string content.
	 */
	public function test_caption_track_save_rejects_non_string_content() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload            = $this->track_payload();
		$payload['content'] = array( 'not' => 'a string' );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Tests that a cue block's inner HTML is stripped from stored content.
	 *
	 * Cue blocks are rebuilt from their name and attributes only, so markup
	 * smuggled inside a block wrapper must not survive into post_content.
	 */
	public function test_caption_track_content_drops_cue_inner_html() {
		$content = $this->stored_track_content(
			'<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000","text":"Hello"} --><script>alert(1)</script><!-- /wp:videopress/caption-cue -->'
		);

		$this->assertStringNotContainsString( '<script', $content );
		$this->assertStringNotContainsString( 'alert(1)', $content );

		$blocks = parse_blocks( $content );
		$this->assertCount( 1, $blocks );
		$this->assertSame( Caption_Tracks::CUE_BLOCK_NAME, $blocks[0]['blockName'] );
		$this->assertSame( 'Hello', $blocks[0]['attrs']['text'] );
		$this->assertSame( '', $blocks[0]['innerHTML'] );
	}

	/**
	 * Tests that content over the byte cap is rejected with a 400.
	 */
	public function test_caption_track_save_denied_for_oversized_content() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload            = $this->track_payload();
		$payload['content'] = str_repeat( 'a', WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks::MAX_CONTENT_BYTES + 1 );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'videopress_caption_track_too_large', $response->get_data()['code'] );
	}

	/**
	 * Tests that content over the cue-count cap is rejected with a 400.
	 */
	public function test_caption_track_save_denied_for_too_many_cues() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload            = $this->track_payload();
		$payload['content'] = str_repeat( '<!-- wp:videopress/caption-cue /-->', WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks::MAX_CUE_BLOCKS + 1 );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'videopress_caption_track_too_large', $response->get_data()['code'] );
	}

	/**
	 * Tests that a body-supplied ID on the collection POST route is ignored.
	 *
	 * Only the item routes' URL path carries a track ID; the handler reads it
	 * from the URL params, not `get_param()`. A collection POST that smuggles an
	 * `id` in its body therefore creates a new track rather than updating the
	 * referenced one, so a request can't re-target another track through the body.
	 */
	public function test_collection_post_ignores_body_id() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create_request->set_body_params( $this->track_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$payload          = $this->track_payload();
		$payload['id']    = $created['id'];
		$payload['title'] = 'Renamed track';

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		// A new track is created; the referenced track is left untouched.
		$this->assertNotSame( $created['id'], $response->get_data()['id'] );
		$this->assertNotSame( 'Renamed track', get_post( $created['id'] )->post_title );
	}

	/**
	 * Tests that a query-string ID can't lift the list route past its GUID check.
	 *
	 * The list route authorizes against its `guid`. A caller who owns some track
	 * must not be able to enumerate another video's captions by smuggling that
	 * track's id into `?id=`; the permission check only trusts a path (URL) id.
	 */
	public function test_list_tracks_ignores_query_id_for_authorization() {
		// The victim's video, owned by another user.
		$victim_guid = 'vid05678';
		$this->create_videopress_attachment( $victim_guid, $this->author_id );

		// The caller owns their own video and a caption track on it.
		$attacker_guid = 'atkr0000';
		$this->create_videopress_attachment( $attacker_guid, $this->other_author_id );
		wp_set_current_user( $this->other_author_id );

		$create = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$create->set_body_params( $this->track_payload_for_guid( $attacker_guid ) );
		$own_track = $this->server->dispatch( $create )->get_data();

		// Listing the victim's captions with the caller's own track id must be denied.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_query_params(
			array(
				'guid' => $victim_guid,
				'id'   => $own_track['id'],
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests that invalid and generated language tags are rejected with a 400.
	 */
	public function test_caption_track_save_denied_for_invalid_language() {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		foreach ( array( 'not a tag!', 'auto_en' ) as $language ) {
			$payload = $this->track_payload();
			$payload['meta'][ Caption_Tracks::META_SRC_LANG ] = $language;

			$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
			$request->set_body_params( $payload );

			$response = $this->server->dispatch( $request );

			$this->assertSame( 400, $response->get_status() );
			$this->assertSame( 'videopress_caption_track_invalid_language', $response->get_data()['code'] );
		}
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
	 * Save a track with the given content and return the stored, unslashed content.
	 *
	 * @param string $content Raw serialized block content.
	 * @return string Stored content as core would serve it.
	 */
	private function stored_track_content( $content ) {
		$this->create_videopress_attachment( 'abcd1234', $this->admin_id );
		wp_set_current_user( $this->admin_id );

		$payload            = $this->track_payload();
		$payload['content'] = $content;

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/videopress/caption-tracks' );
		$request->set_body_params( $payload );

		/*
		 * WorDBless doesn't unslash on insert the way core does, so unslash the
		 * stored content to read what core would serve.
		 */
		return wp_unslash( $this->server->dispatch( $request )->get_data()['content'] );
	}

	/**
	 * Save a track with the given content and return its stored caption-cue blocks.
	 *
	 * @param string $content Raw serialized block content.
	 * @return array Parsed caption-cue blocks, re-indexed.
	 */
	private function stored_cue_blocks( $content ) {
		return array_values(
			array_filter(
				parse_blocks( $this->stored_track_content( $content ) ),
				static function ( $block ) {
					return Caption_Tracks::CUE_BLOCK_NAME === $block['blockName'];
				}
			)
		);
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
				Caption_Tracks::META_SRC_LANG              => 'pt-BR',
				Caption_Tracks::META_LABEL                 => 'Portuguese',
				Caption_Tracks::META_SOURCE_TRACK_KIND     => 'captions',
				Caption_Tracks::META_SOURCE_TRACK_SRC_LANG => 'auto_en',
				Caption_Tracks::META_SOURCE_TRACK_SRC      => 'https://example.com/auto.vtt',
			),
		);
	}
}
