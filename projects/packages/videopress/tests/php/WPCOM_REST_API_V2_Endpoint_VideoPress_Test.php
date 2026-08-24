<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_VideoPress route registration and argument validation.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Server;

/**
 * Validates that REST route schemas correctly enforce argument constraints.
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Test extends BaseTestCase {

	/**
	 * Full route keys used across tests.
	 */
	private const ROUTE_META            = '/wpcom/v2/videopress/meta';
	private const ROUTE_POSTER          = '/wpcom/v2/videopress/(?P<video_guid>[A-Za-z0-9]{8})/poster';
	private const ROUTE_CHECK_OWNERSHIP = '/wpcom/v2/videopress/(?P<video_guid>[A-Za-z0-9]{8})/check-ownership/(?P<post_id>\d+)';
	private const ROUTE_UPLOAD_JWT      = '/wpcom/v2/videopress/upload-jwt';
	private const ROUTE_PLAYBACK_JWT    = '/wpcom/v2/videopress/playback-jwt/(?P<video_guid>[A-Za-z0-9]{8})';
	private const ROUTE_SETTINGS        = '/wpcom/v2/videopress/settings';
	private const ROUTE_PROMOTE         = '/wpcom/v2/videopress/promote/(?P<attachment_id>\d+)';

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		new WPCOM_REST_API_V2_Endpoint_VideoPress();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Create a user with the given role and set them as the current user.
	 *
	 * @param string $role WP role slug.
	 * @return int The user ID.
	 */
	private function login_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'settings_' . $role,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Mock a Jetpack connection with a connected owner, so that
	 * Data::can_perform_action() passes off-WPCOM.
	 *
	 * @param int $user_id The user to connect and mark as connection owner.
	 */
	private function mock_connection( $user_id ) {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		( new Tokens() )->update_user_token( $user_id, sprintf( 'key.private.%d', $user_id ), false );
		// Manager::$is_connected is a static cache whose option-update
		// invalidation hooks don't survive WorDBless's between-test hook reset;
		// an earlier test that saw "not connected" would otherwise stick.
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Test that all expected REST routes are registered.
	 */
	public function test_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE_META, $routes );
		$this->assertArrayHasKey( self::ROUTE_POSTER, $routes );
		$this->assertArrayHasKey( self::ROUTE_CHECK_OWNERSHIP, $routes );
		$this->assertArrayHasKey( self::ROUTE_UPLOAD_JWT, $routes );
		$this->assertArrayHasKey( self::ROUTE_PLAYBACK_JWT, $routes );
		$this->assertArrayHasKey( self::ROUTE_SETTINGS, $routes );
		$this->assertArrayHasKey( self::ROUTE_PROMOTE, $routes );
	}

	/**
	 * Test that the settings GET callback returns the full settings shape.
	 */
	public function test_get_settings_returns_settings_shape() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$response = $endpoint->videopress_get_settings();
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'videopress_videos_private_for_site', $data );
		$this->assertArrayHasKey( 'videopress_auto_subtitles_disabled', $data );
		$this->assertArrayHasKey( 'site_is_private', $data );
		$this->assertArrayHasKey( 'site_type', $data );
	}

	/**
	 * Test that the settings POST callback persists both options off-WPCOM
	 * (mirroring videopress/v1/settings; on WPCOM the private-for-site
	 * option is ignored, but IS_WPCOM can't be simulated in this env).
	 */
	public function test_update_settings_persists_options() {
		delete_option( 'videopress_private_enabled_for_site' );
		delete_option( 'videopress_auto_subtitles_disabled' );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_videos_private_for_site', true );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );

		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$response = $endpoint->videopress_update_settings( $request );

		$this->assertSame( 'success', $response->get_data()['code'] );
		// Off-WPCOM every supplied param is honored, so nothing is reported ignored.
		$this->assertArrayNotHasKey( 'ignored', $response->get_data() );
		$this->assertTrue( (bool) get_option( 'videopress_private_enabled_for_site' ) );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
	}

	/**
	 * Test that omitted settings params leave the stored options untouched.
	 */
	public function test_update_settings_ignores_absent_params() {
		update_option( 'videopress_private_enabled_for_site', true );
		update_option( 'videopress_auto_subtitles_disabled', false );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );

		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress();
		$endpoint->videopress_update_settings( $request );

		$this->assertTrue( (bool) get_option( 'videopress_private_enabled_for_site' ) );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
	}

	/**
	 * The settings routes' permission callbacks, exercised through dispatch —
	 * calling the route callbacks directly (as the tests above do) never runs
	 * them. GET requires manage_options; POST additionally requires
	 * Data::can_perform_action() (a connected owner + user, off-WPCOM).
	 */
	public function test_settings_get_dispatch_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test that a logged-in user without manage_options gets a 403 on GET.
	 */
	public function test_settings_get_dispatch_rejects_non_admins() {
		$this->login_as( 'subscriber' );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that an administrator can GET the settings through dispatch.
	 */
	public function test_settings_get_dispatch_allows_admins() {
		$this->login_as( 'administrator' );

		$request  = new \WP_REST_Request( 'GET', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'videopress_videos_private_for_site', $response->get_data() );
	}

	/**
	 * Test that a logged-out POST is rejected with a 401.
	 */
	public function test_settings_post_dispatch_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test that even an administrator can't POST without a Jetpack
	 * connection off-WPCOM: the Data::can_perform_action() term of the
	 * permission callback requires a connected owner and user.
	 */
	public function test_settings_post_dispatch_rejects_unconnected_admin() {
		$this->login_as( 'administrator' );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that a connected administrator can POST through dispatch and the
	 * option persists.
	 */
	public function test_settings_post_dispatch_allows_connected_admin() {
		delete_option( 'videopress_auto_subtitles_disabled' );
		$user_id = $this->login_as( 'administrator' );
		$this->mock_connection( $user_id );

		$request = new \WP_REST_Request( 'POST', self::ROUTE_SETTINGS );
		$request->set_param( 'videopress_auto_subtitles_disabled', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'success', $response->get_data()['code'] );
		$this->assertTrue( (bool) get_option( 'videopress_auto_subtitles_disabled' ) );
	}

	/**
	 * Test that the promote route's attachment_id path param carries an
	 * integer schema and the route regex rejects non-numeric ids outright.
	 */
	public function test_promote_route_has_attachment_id_schema() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_PROMOTE ][0]['args'];

		$this->assertArrayHasKey( 'attachment_id', $args );
		$this->assertSame( 'integer', $args['attachment_id']['type'] );
		$this->assertTrue( $args['attachment_id']['required'] );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/promote/not-a-number' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Test that a logged-out promote POST is rejected with a 401.
	 */
	public function test_promote_dispatch_requires_authentication() {
		wp_set_current_user( 0 );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/promote/123' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test that a user without upload_files can't promote, even when the
	 * connection term of the permission callback would pass.
	 */
	public function test_promote_dispatch_rejects_users_without_upload_files() {
		$user_id = $this->login_as( 'subscriber' );
		$this->mock_connection( $user_id );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/promote/123' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that even an author-level user can't promote without a Jetpack
	 * connection off-WPCOM (Data::can_perform_action() requires one).
	 */
	public function test_promote_dispatch_rejects_unconnected_uploader() {
		$this->login_as( 'author' );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/promote/123' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * A connected author with upload_files must still be denied when the promote
	 * target is an attachment they cannot edit. promote/{id} is the WordPress.com
	 * Simple equivalent of the videopress/v1/upload IDOR: it acts on a
	 * caller-supplied attachment id, so it needs a per-object capability check.
	 */
	public function test_promote_dispatch_requires_edit_post_on_target() {
		$author_id = $this->login_as( 'author' );
		$this->mock_connection( $author_id );

		// An attachment owned by a different author.
		$other_author_id   = wp_insert_user(
			array(
				'user_login' => 'promote_other_author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);
		$victim_attachment = wp_insert_post(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
				'post_author' => $other_author_id,
				'post_title'  => 'Victim video',
			)
		);

		$request  = new \WP_REST_Request( 'POST', "/wpcom/v2/videopress/promote/{$victim_attachment}" );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 403, $response->get_status(), "An author must not promote another user's attachment." );

		// The same connected author clears the permission check for their own
		// attachment (the handler then reports the endpoint unavailable off-WPCOM).
		$own_attachment = wp_insert_post(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
				'post_author' => $author_id,
				'post_title'  => 'My video',
			)
		);
		$request2       = new \WP_REST_Request( 'POST', "/wpcom/v2/videopress/promote/{$own_attachment}" );
		$response2      = rest_get_server()->dispatch( $request2 );
		$this->assertSame( 404, $response2->get_status(), 'The author should clear the permission check and reach the off-WPCOM handler.' );
	}

	/**
	 * Test that a connected uploader clears the permission callback and the
	 * handler then reports the endpoint unavailable off-WPCOM: promotion is
	 * in-process on WordPress.com Simple only (self-hosted promotes walk
	 * videopress/v1/upload/{id} instead), and IS_WPCOM can't be simulated
	 * in this environment.
	 */
	public function test_promote_dispatch_reports_not_available_off_wpcom() {
		$user_id = $this->login_as( 'author' );
		$this->mock_connection( $user_id );

		// Promote an attachment the author owns, so the per-object permission check
		// passes and the handler is reached (it then reports unavailable off-WPCOM).
		$attachment_id = wp_insert_post(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
				'post_author' => $user_id,
				'post_title'  => 'My video',
			)
		);

		$request  = new \WP_REST_Request( 'POST', "/wpcom/v2/videopress/promote/{$attachment_id}" );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'videopress_promote_not_available', $response->get_data()['code'] );
	}

	/**
	 * Build a promote request for an attachment id.
	 *
	 * @param int $attachment_id The attachment id.
	 * @return \WP_REST_Request
	 */
	private function promote_request( $attachment_id ) {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/promote/' . $attachment_id );
		$request->set_param( 'attachment_id', $attachment_id );
		return $request;
	}

	/**
	 * Create an attachment whose attached file has the given path and mime.
	 *
	 * @param string $file The attached-file path (leading slash keeps it verbatim).
	 * @param string $mime The attachment mime type.
	 * @return int The attachment id.
	 */
	private function make_attachment( $file = '/wp-content/blogs.dir/9a1/12345/files/2026/07/test.mp4', $mime = 'video/mp4' ) {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => $mime,
				'post_title'     => 'Promote orchestration fixture',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', $file );
		return $attachment_id;
	}

	/**
	 * Build the promote seam double.
	 *
	 * @return Mock_Promote_Endpoint
	 */
	private function make_promote_double() {
		require_once __DIR__ . '/mocks/class-mock-promote-endpoint.php';
		return new Mock_Promote_Endpoint();
	}

	/**
	 * Test that the promote orchestration reports not-available when the
	 * host seam says so (the production seam's IS_WPCOM path is covered by
	 * the dispatch test above).
	 */
	public function test_promote_orchestration_reports_not_available() {
		$endpoint            = $this->make_promote_double();
		$endpoint->available = false;

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( 123 ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'videopress_promote_not_available', $result->get_error_code() );
		$this->assertSame( 404, $result->get_error_data()['status'] );
	}

	/**
	 * Test that missing, non-attachment, trashed, and non-video targets are
	 * all rejected as invalid attachments before any wpcom seam is touched.
	 */
	public function test_promote_orchestration_rejects_invalid_attachments() {
		$endpoint = $this->make_promote_double();

		$page_id    = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Not an attachment',
			)
		);
		$trashed_id = $this->make_attachment();
		wp_update_post(
			array(
				'ID'          => $trashed_id,
				'post_status' => 'trash',
			)
		);
		$text_id = $this->make_attachment( '/wp-content/blogs.dir/9a1/12345/files/2026/07/notes.txt', 'text/plain' );

		foreach ( array( 999999, $page_id, $trashed_id, $text_id ) as $target ) {
			$result = $endpoint->videopress_promote_attachment( $this->promote_request( $target ) );
			$this->assertInstanceOf( \WP_Error::class, $result, "Target {$target} should be rejected." );
			$this->assertSame( 'videopress_promote_invalid_attachment', $result->get_error_code(), "Target {$target} should be an invalid attachment." );
		}
		$this->assertSame( array(), $endpoint->transcoded );
	}

	/**
	 * Test that a site without VideoPress gets a 403 from the plan gate.
	 */
	public function test_promote_orchestration_requires_videopress_plan() {
		$endpoint                 = $this->make_promote_double();
		$endpoint->has_videopress = false;
		$attachment_id            = $this->make_attachment();

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertSame( 'videopress_promote_not_allowed', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that unavailable transcode primitives produce a clean 500.
	 */
	public function test_promote_orchestration_reports_unavailable_primitives() {
		$endpoint                    = $this->make_promote_double();
		$endpoint->primitives_loaded = false;
		$attachment_id               = $this->make_attachment();

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertSame( 'videopress_promote_unavailable', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * Test that an attachment already on VideoPress reports success
	 * idempotently without invoking the primitive.
	 */
	public function test_promote_orchestration_is_idempotent_for_live_videos() {
		$endpoint              = $this->make_promote_double();
		$endpoint->video_infos = array( (object) array( 'guid' => 'AbCd1234' ) );
		$attachment_id         = $this->make_attachment();

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame(
			array(
				'guid'               => 'AbCd1234',
				'media_id'           => $attachment_id,
				'already_videopress' => true,
			),
			$result->get_data()
		);
		$this->assertSame( array(), $endpoint->transcoded );
	}

	/**
	 * Test that a tombstoned videos row produces the specific 409 instead of
	 * an unexplained failure, without invoking the primitive.
	 */
	public function test_promote_orchestration_rejects_previously_deleted_videos() {
		$endpoint           = $this->make_promote_double();
		$endpoint->any_guid = 'DeAd1234';
		$attachment_id      = $this->make_attachment();

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertSame( 'videopress_promote_previously_deleted', $result->get_error_code() );
		$this->assertSame( 409, $result->get_error_data()['status'] );
		$this->assertSame( array(), $endpoint->transcoded );
	}

	/**
	 * Test that a file outside the blogs.dir shape fails clean with a 400 —
	 * the primitive would otherwise create a broken row plus a malformed
	 * transcode job stuck at "Processing" forever.
	 */
	public function test_promote_orchestration_rejects_non_blogsdir_files() {
		$endpoint      = $this->make_promote_double();
		$attachment_id = $this->make_attachment( '/var/imported/2026/07/migrated.mp4' );

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertSame( 'videopress_promote_unsupported_file', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertSame( array(), $endpoint->transcoded );
	}

	/**
	 * Test that a concurrent promote holding the lock turns into a 409 and
	 * the primitive is not invoked.
	 */
	public function test_promote_orchestration_respects_the_promote_lock() {
		$endpoint      = $this->make_promote_double();
		$attachment_id = $this->make_attachment();
		$lock          = $endpoint->lock_key( get_current_blog_id(), $attachment_id );

		$result = null;
		wp_cache_add( $lock, 1, 'video-info', 30 );
		try {
			$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );
		} finally {
			wp_cache_delete( $lock, 'video-info' );
		}

		$this->assertSame( 'videopress_promote_in_progress', $result->get_error_code() );
		$this->assertSame( 409, $result->get_error_data()['status'] );
		$this->assertSame( array(), $endpoint->transcoded );
	}

	/**
	 * Test the fresh-promote happy path: the primitive runs once, the
	 * verification read supplies the new guid, and the lock is released.
	 */
	public function test_promote_orchestration_promotes_and_releases_the_lock() {
		$endpoint              = $this->make_promote_double();
		$endpoint->video_infos = array( false, (object) array( 'guid' => 'Ne3w1234' ) );
		$attachment_id         = $this->make_attachment();
		$lock                  = $endpoint->lock_key( get_current_blog_id(), $attachment_id );

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame(
			array(
				'guid'     => 'Ne3w1234',
				'media_id' => $attachment_id,
			),
			$result->get_data()
		);
		$this->assertSame( array( $attachment_id ), $endpoint->transcoded );
		$this->assertFalse( wp_cache_get( $lock, 'video-info' ), 'The promote lock should be released after success.' );
	}

	/**
	 * Test that a promote whose verification read finds no row reports a 500
	 * — the primitive returns bare false for every bail reason — and still
	 * releases the lock.
	 */
	public function test_promote_orchestration_reports_failure_and_releases_the_lock() {
		$endpoint      = $this->make_promote_double();
		$attachment_id = $this->make_attachment();
		$lock          = $endpoint->lock_key( get_current_blog_id(), $attachment_id );

		$result = $endpoint->videopress_promote_attachment( $this->promote_request( $attachment_id ) );

		$this->assertSame( 'videopress_promote_failed', $result->get_error_code() );
		$this->assertSame( 500, $result->get_error_data()['status'] );
		$this->assertSame( array( $attachment_id ), $endpoint->transcoded );
		$this->assertFalse( wp_cache_get( $lock, 'video-info' ), 'The promote lock should be released after failure.' );
	}

	/**
	 * Test that the real (non-double) wpcom seams fail closed off-WPCOM:
	 * the transcode primitives can't be loaded (the admin-plugins files
	 * don't exist here) and the plan gate reports no VideoPress.
	 */
	public function test_promote_real_seams_fail_closed_off_wpcom() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// The wpcom test harness (wpcut) runs this suite inside the real
			// platform, where the primitives load and the plan gate is live.
			$this->markTestSkipped( 'On WordPress.com the real seams are open by design.' );
		}

		$endpoint = new class() extends WPCOM_REST_API_V2_Endpoint_VideoPress {
			/**
			 * Expose the protected primitives-loading seam.
			 *
			 * @return bool
			 */
			public function load_primitives() {
				return $this->promote_load_primitives();
			}

			/**
			 * Expose the protected plan-gate seam.
			 *
			 * @param int $blog_id The blog id.
			 * @return bool
			 */
			public function plan_gate( $blog_id ) {
				return $this->promote_site_has_videopress( $blog_id );
			}
		};

		$this->assertFalse( $endpoint->load_primitives(), 'Transcode primitives must not be loadable off-WPCOM.' );
		$this->assertFalse( $endpoint->plan_gate( get_current_blog_id() ), 'The plan gate must fail closed off-WPCOM.' );
	}

	/**
	 * Data provider for valid privacy_setting values.
	 *
	 * @return array[] Test cases.
	 */
	public static function valid_privacy_settings_provider(): array {
		return array(
			'public'       => array( \VIDEOPRESS_PRIVACY::IS_PUBLIC ),
			'private'      => array( \VIDEOPRESS_PRIVACY::IS_PRIVATE ),
			'site_default' => array( \VIDEOPRESS_PRIVACY::SITE_DEFAULT ),
		);
	}

	/**
	 * Test that valid privacy_setting values pass the registered schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider valid_privacy_settings_provider
	 */
	#[DataProvider( 'valid_privacy_settings_provider' )]
	public function test_privacy_setting_accepts_valid_values( int $value ) {
		$routes = rest_get_server()->get_routes();
		$schema = $routes[ self::ROUTE_META ][0]['args']['privacy_setting'];

		$this->assertTrue( rest_validate_value_from_schema( $value, $schema, 'privacy_setting' ) );
	}

	/**
	 * Data provider for invalid privacy_setting values.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_privacy_settings_provider(): array {
		return array(
			'negative'     => array( -1 ),
			'out_of_range' => array( 3 ),
			'large_number' => array( 99 ),
		);
	}

	/**
	 * Test that invalid privacy_setting values fail the registered schema validation.
	 *
	 * @param int $value The privacy setting value.
	 *
	 * @dataProvider invalid_privacy_settings_provider
	 */
	#[DataProvider( 'invalid_privacy_settings_provider' )]
	public function test_privacy_setting_rejects_invalid_values( int $value ) {
		$routes = rest_get_server()->get_routes();
		$schema = $routes[ self::ROUTE_META ][0]['args']['privacy_setting'];

		$this->assertInstanceOf( \WP_Error::class, rest_validate_value_from_schema( $value, $schema, 'privacy_setting' ) );
	}

	/**
	 * Test that meta route args besides 'id' are optional.
	 */
	public function test_meta_route_args_are_optional() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_META ][0]['args'];

		$this->assertTrue( $args['id']['required'] );

		$optional_args = array( 'title', 'description', 'caption', 'rating', 'display_embed', 'allow_download', 'privacy_setting' );
		foreach ( $optional_args as $arg_name ) {
			$this->assertArrayHasKey( $arg_name, $args, "Arg '{$arg_name}' should be registered." );
			$this->assertEmpty( $args[ $arg_name ]['required'] ?? false, "Arg '{$arg_name}' should be optional." );
		}
	}

	/**
	 * Test that poster route has video_guid arg with correct type.
	 */
	public function test_poster_route_has_video_guid_schema() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_POSTER ][0]['args'];

		$this->assertArrayHasKey( 'video_guid', $args );
		$this->assertSame( 'string', $args['video_guid']['type'] );
	}

	/**
	 * Test that the route regex rejects invalid video GUIDs.
	 */
	public function test_route_rejects_invalid_video_guid() {
		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/too-long-guid' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Test that the route regex accepts a valid video GUID.
	 */
	public function test_route_accepts_valid_video_guid() {
		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/AbCd1234' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertNotEquals( 404, $response->get_status() );
	}

	/**
	 * Test that check-ownership route has schemas for both path params.
	 */
	public function test_check_ownership_route_has_path_param_schemas() {
		$routes = rest_get_server()->get_routes();
		$args   = $routes[ self::ROUTE_CHECK_OWNERSHIP ][0]['args'];

		$this->assertArrayHasKey( 'video_guid', $args );
		$this->assertSame( 'string', $args['video_guid']['type'] );

		$this->assertArrayHasKey( 'post_id', $args );
		$this->assertSame( 'integer', $args['post_id']['type'] );
	}

	/**
	 * An author must not be able to update the metadata of somebody else's video.
	 *
	 * The route used to require only the generic edit_posts capability, so any
	 * contributor could target an arbitrary attachment id -- including flipping
	 * a video's privacy_setting from private to public. Dispatching the real
	 * route pins the per-object check: against the unfixed callback this
	 * reaches the handler instead of being rejected.
	 */
	public function test_meta_dispatch_rejects_author_for_another_users_video() {
		$user_id = $this->login_as( 'author' );
		$this->mock_connection( $user_id );
		$victim_attachment = $this->create_attachment_owned_by( $user_id + 1000 );

		$response = $this->dispatch_meta_update( $victim_attachment );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * The owner of a video still clears the permission check.
	 *
	 * Guards the other direction: the per-object check must not stop people
	 * editing their own videos. The update itself cannot complete under test
	 * (request signing fails against the fixture blog token), so this asserts
	 * only that the caller is not rejected.
	 */
	public function test_meta_dispatch_allows_owner_of_the_video() {
		$user_id = $this->login_as( 'author' );
		$this->mock_connection( $user_id );
		$own_attachment = $this->create_attachment_owned_by( $user_id );

		$response = $this->dispatch_meta_update( $own_attachment );
		$this->assertNotSame(
			403,
			$response->get_status(),
			'The owner must clear the permission check for their own video.'
		);
	}

	/**
	 * The poster read must stay closed to logged-out visitors.
	 *
	 * Per-video authorization alone does not close this route to anonymous
	 * callers: is_current_user_authed_for_video() has no logged-out bail and
	 * returns true for an effectively public video, which would leave the
	 * handler's outbound WordPress.com requests reachable unauthenticated.
	 * Anonymous access was not possible before the per-video check was
	 * introduced, and must not become possible because of it.
	 */
	public function test_poster_read_rejects_anonymous_request() {
		$guid = 'pUbLiC01';
		wp_set_current_user( 0 );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PUBLIC );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'GET', '/wpcom/v2/videopress/' . $guid . '/poster' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * A subscriber must not be able to read the poster of a private video.
	 *
	 * The route used to require only `read`, so any logged-in user could read
	 * the poster -- and, via the at_time parameter, scrape arbitrary frames --
	 * of any video on the site by guid.
	 */
	public function test_poster_read_rejects_subscriber_for_private_video() {
		$guid = 'pRiVaTe3';
		$this->login_as( 'subscriber' );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PRIVATE );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'GET', '/wpcom/v2/videopress/' . $guid . '/poster' )
		);

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * A user who can edit the site's videos still clears the poster read check.
	 *
	 * The outbound request cannot complete under test, so this asserts only
	 * that the caller is not rejected by the permission callback.
	 */
	public function test_poster_read_allows_user_who_can_edit_videos() {
		$guid    = 'pRiVaTe4';
		$user_id = $this->login_as( 'administrator' );
		$this->mock_connection( $user_id );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PRIVATE );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'GET', '/wpcom/v2/videopress/' . $guid . '/poster' )
		);

		$this->assertNotSame( 401, $response->get_status() );
		$this->assertNotSame( 403, $response->get_status() );
	}

	/**
	 * An author must not be able to overwrite the poster of another user's video.
	 *
	 * The route used to require only the site-wide upload_files capability,
	 * which every author has, so any author could target any guid.
	 */
	public function test_poster_write_rejects_author_for_another_users_video() {
		$guid    = 'pOsTeR01';
		$user_id = $this->login_as( 'author' );
		$this->mock_connection( $user_id );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PUBLIC, $user_id + 1000 );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/' . $guid . '/poster' )
		);

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * The owner of a video still clears the poster write check.
	 */
	public function test_poster_write_allows_owner_of_the_video() {
		$guid    = 'pOsTeR02';
		$user_id = $this->login_as( 'administrator' );
		$this->mock_connection( $user_id );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PUBLIC, $user_id );

		$response = rest_get_server()->dispatch(
			new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/' . $guid . '/poster' )
		);

		$this->assertNotSame(
			403,
			$response->get_status(),
			'The owner must clear the permission check for their own video.'
		);
	}

	/**
	 * Create an attachment owned by the given user.
	 *
	 * @param int $author_id The owning user id.
	 * @return int The attachment post id.
	 */
	private function create_attachment_owned_by( $author_id ) {
		return (int) wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_author'    => $author_id,
				'post_title'     => 'Video ' . $author_id,
			)
		);
	}

	/**
	 * Dispatch a metadata update for the given attachment id.
	 *
	 * The id travels in the JSON body, matching videopress_block_update_meta().
	 *
	 * @param int $attachment_id The attachment to target.
	 * @return \WP_REST_Response
	 */
	private function dispatch_meta_update( $attachment_id ) {
		$request = new \WP_REST_Request( 'POST', self::ROUTE_META );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'id' => $attachment_id ), JSON_UNESCAPED_SLASHES ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * A subscriber must not receive a playback token for a private video.
	 *
	 * The route's permission callback only requires `read`, which every logged-in
	 * user has, so the per-video authorization in the handler is the only thing
	 * between an arbitrary subscriber and a token for an arbitrary guid. This
	 * dispatches the real route so the whole chain stays covered; without the
	 * authorization check it returns 200 and a playback_token.
	 */
	public function test_playback_jwt_dispatch_rejects_subscriber_for_private_video() {
		$guid    = 'pRiVaTe1';
		$user_id = $this->login_as( 'subscriber' );
		$this->mock_connection( $user_id );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PRIVATE, $user_id );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/' . $guid );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'unauthorized', $response->get_data()['code'] );
		$this->assertArrayNotHasKey(
			'playback_token',
			$response->get_data(),
			'An unauthorized caller must not be handed a playback token.'
		);
	}

	/**
	 * A user who can edit the site's videos still clears the authorization check.
	 *
	 * Guards the other direction: the check must not lock out the VideoPress
	 * dashboard, whose preview player is the only in-tree caller of this route.
	 * The token itself cannot be minted under test (the blog token is a
	 * fixture, so request signing fails), so this asserts only that the caller
	 * reaches the token-issuing path rather than being rejected.
	 */
	public function test_playback_jwt_dispatch_allows_user_who_can_edit_videos() {
		$guid    = 'pRiVaTe2';
		$user_id = $this->login_as( 'administrator' );
		$this->mock_connection( $user_id );
		$this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PRIVATE, $user_id );

		$request  = new \WP_REST_Request( 'POST', '/wpcom/v2/videopress/playback-jwt/' . $guid );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'playback_token', $response->get_data() );
	}

	/**
	 * Create a VideoPress attachment with a given privacy setting.
	 *
	 * @param string   $guid            The VideoPress guid to associate.
	 * @param int      $privacy_setting The privacy setting constant to seed.
	 * @param int|null $author_id       Optional owning user id.
	 * @return int The attachment post id.
	 */
	private function create_videopress_attachment( $guid, $privacy_setting, $author_id = null ) {
		$attachment_id = (int) wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_author'    => (int) $author_id,
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'videopress' => array(
					'privacy_setting' => $privacy_setting,
				),
			)
		);

		// WorDBless does not fully emulate WP_Query meta_query; seed the guid->id cache that
		// videopress_get_post_id_by_guid() consults before querying.
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $attachment_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_' . $guid, 'videopress' );

		return $attachment_id;
	}
}
