<?php
/**
 * Tests for VideoPress caption drafts.
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
 * Test suite for caption draft CPT and REST routes.
 */
class Caption_Drafts_Test extends BaseTestCase {

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

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Caption_Drafts::register_post_type();
		Caption_Drafts::register_meta();
		Rest_Controller::init();
		do_action( 'rest_api_init' );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'caption_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
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
	 * Tests that the caption draft post type is private and REST enabled.
	 */
	public function test_post_type_is_private_and_rest_enabled() {
		$post_type = get_post_type_object( Caption_Drafts::POST_TYPE );

		$this->assertNotFalse( $post_type );
		$this->assertFalse( $post_type->public );
		$this->assertFalse( $post_type->show_ui );
		$this->assertTrue( $post_type->show_in_rest );
		$this->assertSame( 'videopress-caption-drafts', $post_type->rest_base );
	}

	/**
	 * Tests manual language canonicalization.
	 */
	public function test_manual_language_is_canonicalized() {
		$this->assertSame( 'pt-BR', Caption_Drafts::sanitize_manual_language( 'pt-br' ) );
		$this->assertSame( 'zh-Hant-TW', Caption_Drafts::sanitize_manual_language( 'zh-hant-tw' ) );
	}

	/**
	 * Tests that generated language keys are rejected for manual draft language.
	 */
	public function test_generated_language_keys_are_rejected_for_manual_language() {
		$this->assertSame( '', Caption_Drafts::sanitize_manual_language( 'auto_en' ) );
	}

	/**
	 * Tests that non-admin users cannot save caption drafts.
	 */
	public function test_caption_draft_save_requires_manage_options() {
		wp_set_current_user( $this->subscriber_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-drafts' );
		$request->set_body_params( $this->draft_payload() );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Tests saving a caption draft through REST.
	 */
	public function test_caption_draft_can_be_saved() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-drafts' );
		$request->set_body_params( $this->draft_payload() );

		$response = $this->server->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( Caption_Drafts::POST_TYPE, get_post_type( $data['id'] ) );
		$this->assertSame( 'draft', get_post_status( $data['id'] ) );
		$this->assertSame( 'pt-BR', get_post_meta( $data['id'], Caption_Drafts::META_SRC_LANG, true ) );
		$this->assertSame( 'auto_en', get_post_meta( $data['id'], Caption_Drafts::META_SOURCE_TRACK_SRC_LANG, true ) );
	}

	/**
	 * Tests updating an existing caption draft.
	 */
	public function test_caption_draft_can_be_updated() {
		wp_set_current_user( $this->admin_id );

		$create_request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/caption-drafts' );
		$create_request->set_body_params( $this->draft_payload() );
		$created = $this->server->dispatch( $create_request )->get_data();

		$update_request = new WP_REST_Request( 'PUT', '/jetpack/v4/videopress/caption-drafts/' . $created['id'] );
		$update_request->set_body_params(
			array_merge(
				$this->draft_payload(),
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
	 * Default draft payload.
	 *
	 * @return array
	 */
	private function draft_payload() {
		return array(
			'title'   => 'Portuguese captions',
			'content' => '<!-- wp:videopress/caption-cue {"startTime":"00:00:00.000","endTime":"00:00:02.000","text":"Hello"} /-->',
			'status'  => 'draft',
			'meta'    => array(
				Caption_Drafts::META_GUID                  => 'abcd1234',
				Caption_Drafts::META_KIND                  => 'captions',
				Caption_Drafts::META_SRC_LANG              => 'pt-br',
				Caption_Drafts::META_LABEL                 => 'Portuguese',
				Caption_Drafts::META_SOURCE_TRACK_KIND     => 'captions',
				Caption_Drafts::META_SOURCE_TRACK_SRC_LANG => 'auto_en',
				Caption_Drafts::META_SOURCE_TRACK_SRC      => 'https://example.com/auto.vtt',
			),
		);
	}
}
