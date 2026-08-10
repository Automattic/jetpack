<?php
/**
 * Tests for the VideoPress uploader REST endpoints.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Server;

/**
 * Verify upload-route validation and per-attachment authorization.
 */
class Uploader_Rest_Endpoints_Test extends BaseTestCase {

	/**
	 * Files created for attachment fixtures.
	 *
	 * @var string[]
	 */
	private $uploaded_files = array();

	/**
	 * Set up an isolated REST server containing the uploader routes.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		Uploader_Rest_Endpoints::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up users, posts, files, and the REST server.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Posts::init()->clear_all_posts();

		foreach ( $this->uploaded_files as $file ) {
			if ( is_file( $file ) ) {
				wp_delete_file( $file );
			}
		}

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tearDown();
	}

	/**
	 * Create a user fixture.
	 *
	 * @param string $login User login.
	 * @param string $role  User role.
	 * @return int User ID.
	 */
	private function create_user( $login, $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		$this->assertIsInt( $user_id );

		return $user_id;
	}

	/**
	 * Create a readable attachment backed by the sample-video fixture.
	 *
	 * @param int    $author_id Attachment author ID.
	 * @param string $mime_type Attachment MIME type.
	 * @return int Attachment ID.
	 */
	private function create_attachment( $author_id, $mime_type = 'video/mp4' ) {
		$contents = file_get_contents( __DIR__ . '/assets/sample-video.mp4' );
		$this->assertNotFalse( $contents );

		$upload = wp_upload_bits( 'videopress-rest-' . wp_generate_uuid4() . '.mp4', null, $contents );
		$this->assertEmpty( $upload['error'] );
		$this->uploaded_files[] = $upload['file'];

		$attachment_id = wp_insert_attachment(
			array(
				'post_author'    => $author_id,
				'post_mime_type' => $mime_type,
				'post_status'    => 'inherit',
				'post_title'     => 'Uploader REST fixture',
			),
			$upload['file']
		);
		$this->assertIsInt( $attachment_id );
		update_attached_file( $attachment_id, $upload['file'] );

		return $attachment_id;
	}

	/**
	 * Make an attachment report an already-completed VideoPress upload.
	 *
	 * This keeps successful route dispatches local: both GET and POST return the
	 * stored result before constructing a remote upload client.
	 *
	 * @param int $attachment_id Source attachment ID.
	 * @param int $author_id     Attachment author ID.
	 * @return void
	 */
	private function mark_attachment_as_uploaded( $attachment_id, $author_id ) {
		$videopress_attachment_id = wp_insert_post(
			array(
				'post_author'    => $author_id,
				'post_mime_type' => 'video/videopress',
				'post_status'    => 'inherit',
				'post_title'     => 'Completed VideoPress fixture',
				'post_type'      => 'attachment',
			)
		);
		$this->assertIsInt( $videopress_attachment_id );

		update_post_meta( $videopress_attachment_id, 'videopress_guid', 'Abcd1234' );
		update_post_meta( $attachment_id, Uploader::UPLOADED_KEY, $videopress_attachment_id );
	}

	/**
	 * Dispatch one uploader request.
	 *
	 * @param string $method        HTTP method.
	 * @param int    $attachment_id Attachment ID.
	 * @return \WP_REST_Response REST response.
	 */
	private function dispatch_upload_request( $method, $attachment_id ) {
		$request = new \WP_REST_Request( $method, '/videopress/v1/upload/' . $attachment_id );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Both upload methods must enforce the target attachment's edit capability.
	 */
	public function test_upload_routes_require_edit_post_on_target() {
		$author_id        = $this->create_user( 'upload_route_author', 'author' );
		$other_author_id  = $this->create_user( 'upload_route_other_author', 'author' );
		$own_attachment   = $this->create_attachment( $author_id );
		$other_attachment = $this->create_attachment( $other_author_id );

		$this->mark_attachment_as_uploaded( $own_attachment, $author_id );
		$this->mark_attachment_as_uploaded( $other_attachment, $other_author_id );
		wp_set_current_user( $author_id );

		foreach ( array( 'GET', 'POST' ) as $method ) {
			$own_response = $this->dispatch_upload_request( $method, $own_attachment );
			$this->assertSame( 200, $own_response->get_status(), "$method must allow an author's own attachment." );
			$this->assertSame( 'uploaded', $own_response->get_data()['status'] );

			$other_response = $this->dispatch_upload_request( $method, $other_attachment );
			$this->assertSame( 403, $other_response->get_status(), "$method must reject another author's attachment." );
		}

		$editor_id = $this->create_user( 'upload_route_editor', 'editor' );
		wp_set_current_user( $editor_id );

		foreach ( array( 'GET', 'POST' ) as $method ) {
			$response = $this->dispatch_upload_request( $method, $other_attachment );
			$this->assertSame( 200, $response->get_status(), "$method must preserve an editor's access to another user's attachment." );
			$this->assertSame( 'uploaded', $response->get_data()['status'] );
		}
	}

	/**
	 * Semantic attachment validation must not run before authorization.
	 *
	 * If the route validator checks the file and MIME type first, logged-out
	 * callers receive 401 for a real video but 400 for an invalid ID, exposing a
	 * video-attachment enumeration oracle before the permission callback runs.
	 */
	public function test_logged_out_requests_do_not_reveal_valid_video_ids() {
		$author_id          = $this->create_user( 'upload_oracle_author', 'author' );
		$valid_attachment   = $this->create_attachment( $author_id );
		$missing_attachment = $valid_attachment + 1000000;
		wp_set_current_user( 0 );

		foreach ( array( 'GET', 'POST' ) as $method ) {
			$valid_response   = $this->dispatch_upload_request( $method, $valid_attachment );
			$missing_response = $this->dispatch_upload_request( $method, $missing_attachment );

			$this->assertSame( 401, $valid_response->get_status() );
			$this->assertSame( 401, $missing_response->get_status(), "$method must authorize before inspecting the attachment." );
		}
	}

	/**
	 * Removing semantic validation from the route schema must not make invalid
	 * targets usable after a caller passes the per-object permission check.
	 */
	public function test_authorized_non_video_attachment_is_still_rejected() {
		$author_id     = $this->create_user( 'upload_non_video_author', 'author' );
		$attachment_id = $this->create_attachment( $author_id, 'text/plain' );
		wp_set_current_user( $author_id );

		foreach ( array( 'GET', 'POST' ) as $method ) {
			$response = $this->dispatch_upload_request( $method, $attachment_id );
			$this->assertSame( 400, $response->get_status() );
			$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		}
	}
}
