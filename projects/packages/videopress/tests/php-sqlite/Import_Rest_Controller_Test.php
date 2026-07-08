<?php
/**
 * Tests for the Studio YouTube import REST endpoints: flag-gated
 * registration, the mock-backed connection and listing (paging +
 * already_imported), synchronous draft-placeholder creation with its meta
 * contract, the job status lifecycle, permissions, and the 501 real-mode
 * gate.
 *
 * Lives in the sqlite suite (tests/php-sqlite) because the already-imported
 * lookup runs a WP_Query meta IN query, which needs real database tables.
 * Like Playlists_Test, this deliberately does NOT extend
 * WorDBless\BaseTestCase: its teardown instantiates the dbless module
 * singletons, whose hooks would corrupt real sqlite inserts in later tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test suite for the Import_Rest_Controller class.
 */
class Import_Rest_Controller_Test extends TestCase {

	const ROUTE_CONNECTION = '/jetpack/v4/videopress/import/youtube/connection';
	const ROUTE_VIDEOS     = '/jetpack/v4/videopress/import/youtube/videos';
	const ROUTE_IMPORT     = '/jetpack/v4/videopress/import/youtube';
	const ROUTE_STATUS     = '/jetpack/v4/videopress/import/status/(?P<job_id>[A-Za-z0-9\-]+)';

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * User IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * Job IDs created during the current test, for transient cleanup.
	 *
	 * @var string[]
	 */
	private $job_ids = array();

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Import tests need real tables for the meta IN lookup; run them via the sqlite test suite (composer phpunit).' );
		}
	}

	/**
	 * Clean up after each test.
	 *
	 * The sqlite database persists across tests and runs, so every
	 * placeholder the endpoints created is swept by its dedicated meta key,
	 * and users, transients, filters, and caches are reset.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );

		$imported = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 100,
				'fields'         => 'ids',
				'meta_key'       => Import_Rest_Controller::META_IMPORT_EXTERNAL_ID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_compare'   => 'EXISTS',
			)
		);
		foreach ( $imported as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = array();

		foreach ( $this->job_ids as $job_id ) {
			delete_transient( Import_Rest_Controller::JOB_TRANSIENT_PREFIX . $job_id );
		}
		$this->job_ids = array();

		remove_all_filters( Admin_UI::STUDIO_FILTER );
		remove_all_filters( 'videopress_import_mock_mode' );
		remove_all_filters( 'pre_http_request' );

		global $wp_rest_server;
		$wp_rest_server = null;

		// Firing rest_api_init above built and cached the core post type REST
		// controllers (WP_Post_Type::$rest_controller) with their item schemas.
		// Cached schemas only know the taxonomies registered at build time, so
		// leaving them behind would hide e.g. the playlists field from tests
		// that register their taxonomy later in the same process.
		foreach ( get_post_types( array(), 'objects' ) as $post_type_object ) {
			$post_type_object->rest_controller = null;
		}

		wp_cache_flush();

		parent::tear_down();
	}

	/**
	 * Create a fresh REST server, construct the controller (its internal
	 * should_register() gate mirrors the Initializer), and fire
	 * rest_api_init so the routes (maybe) register.
	 *
	 * @return WP_REST_Server
	 */
	private function initialize_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		new Import_Rest_Controller();
		do_action( 'rest_api_init' );

		return $wp_rest_server;
	}

	/**
	 * Create a user with the given role. Logins are unique per call because
	 * the sqlite database persists across tests and runs.
	 *
	 * @param string $role The user role.
	 * @return int The new user ID.
	 */
	private function create_user_with_role( $role ) {
		$login   = 'vps_import_' . $role . '_' . uniqid();
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'user_email' => $login . '@example.com',
				'role'       => $role,
			)
		);
		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;

		return $user_id;
	}

	/**
	 * Full environment for the happy-path tests: Studio flag on, author as
	 * the current user, outgoing HTTP blocked (so the thumbnail sideload
	 * deterministically falls back to URL-only), routes registered.
	 */
	private function setup_environment() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'http_blocked', 'No network in tests.' );
			}
		);

		wp_set_current_user( $this->create_user_with_role( 'author' ) );
		$this->initialize_rest_server();
	}

	/**
	 * Dispatch a request against the import routes.
	 *
	 * @param string     $method HTTP method.
	 * @param string     $path   Request path.
	 * @param array|null $body   JSON body, if any.
	 * @param array      $query  Query params, if any.
	 * @return \WP_REST_Response The response.
	 */
	private function dispatch( $method, $path, $body = null, $query = array() ) {
		$request = new WP_REST_Request( $method, $path );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}
		if ( $query ) {
			$request->set_query_params( $query );
		}

		return $this->server->dispatch( $request );
	}

	/**
	 * POST an import and track its job for transient cleanup.
	 *
	 * @param string[] $video_ids The external IDs to import.
	 * @return \WP_REST_Response The response.
	 */
	private function post_import( $video_ids ) {
		$response = $this->dispatch( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => $video_ids ) );

		$data = $response->get_data();
		if ( is_array( $data ) && isset( $data['job_id'] ) ) {
			$this->job_ids[] = $data['job_id'];
		}

		return $response;
	}

	/**
	 * Load the bundled fixture videos the mock serves.
	 *
	 * @return array The fixture listing items.
	 */
	private function get_fixture_videos() {
		$fixtures = require dirname( __DIR__, 2 ) . '/src/import-fixtures/youtube-videos.php';

		return $fixtures['videos'];
	}

	/** Tests that no import routes register while the Studio flag is off. */
	public function test_routes_not_registered_when_studio_flag_off() {
		$server = $this->initialize_rest_server();

		$routes = $server->get_routes();
		foreach ( array( self::ROUTE_CONNECTION, self::ROUTE_VIDEOS, self::ROUTE_IMPORT, self::ROUTE_STATUS ) as $route ) {
			$this->assertArrayNotHasKey( $route, $routes );
		}
	}

	/** Tests that all four import routes register when the Studio flag is on. */
	public function test_routes_registered_when_studio_flag_on() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		$server = $this->initialize_rest_server();

		$routes = $server->get_routes();
		foreach ( array( self::ROUTE_CONNECTION, self::ROUTE_VIDEOS, self::ROUTE_IMPORT, self::ROUTE_STATUS ) as $route ) {
			$this->assertArrayHasKey( $route, $routes );
		}
	}

	/** Tests the mock connection endpoints: fixture identity and no-op delete. */
	public function test_connection_mock_identity_and_delete() {
		$this->setup_environment();

		$response = $this->dispatch( 'GET', self::ROUTE_CONNECTION );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['connected'] );
		$this->assertNotSame( '', $data['account_name'] );
		$this->assertIsString( $data['profile_image'] );
		$this->assertNull( $data['connect_url'] );

		$response = $this->dispatch( 'DELETE', self::ROUTE_CONNECTION );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'deleted' => true ), $response->get_data() );
	}

	/** Tests fixture paging: default page size, the token round-trip, and the last page. */
	public function test_listing_pages_through_fixtures() {
		$this->setup_environment();
		$fixture_videos = $this->get_fixture_videos();

		// First page: default number 20, token present.
		$response = $this->dispatch( 'GET', self::ROUTE_VIDEOS );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( 20, $data['videos'] );
		$this->assertIsString( $data['next_page_token'] );

		// Items mirror the fixtures in order and carry the full shape.
		$first = $data['videos'][0];
		$this->assertSame( $fixture_videos[0]['external_id'], $first['external_id'] );
		foreach ( array( 'external_id', 'title', 'description', 'tags', 'duration_seconds', 'privacy', 'published_at', 'thumbnails', 'already_imported', 'attachment_id' ) as $key ) {
			$this->assertArrayHasKey( $key, $first, "Listing items should expose '{$key}'." );
		}
		$this->assertArrayHasKey( 'default', $first['thumbnails'] );
		$this->assertArrayHasKey( 'high', $first['thumbnails'] );
		$this->assertArrayHasKey( 'maxres', $first['thumbnails'] );
		$this->assertFalse( $first['already_imported'] );
		$this->assertNull( $first['attachment_id'] );

		// Second page: the remainder, no further token.
		$response = $this->dispatch( 'GET', self::ROUTE_VIDEOS, null, array( 'page_token' => $data['next_page_token'] ) );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( count( $fixture_videos ) - 20, $data['videos'] );
		$this->assertNull( $data['next_page_token'] );
		$this->assertSame( $fixture_videos[20]['external_id'], $data['videos'][0]['external_id'] );

		// A custom page size issues a matching token.
		$response = $this->dispatch( 'GET', self::ROUTE_VIDEOS, null, array( 'number' => 10 ) );
		$this->assertCount( 10, $response->get_data()['videos'] );
		$this->assertIsString( $response->get_data()['next_page_token'] );
	}

	/** Tests that a token the listing never issued is rejected with 400. */
	public function test_listing_rejects_foreign_page_token() {
		$this->setup_environment();

		$response = $this->dispatch( 'GET', self::ROUTE_VIDEOS, null, array( 'page_token' => 'CAUQAA' ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'import_invalid_page_token', $response->get_data()['code'] );
	}

	/** Tests that imported videos are flagged already_imported (with their attachment) in the listing. */
	public function test_listing_marks_already_imported() {
		$this->setup_environment();
		$fixture_videos = $this->get_fixture_videos();

		$this->post_import( array( $fixture_videos[0]['external_id'] ) );

		$data = $this->dispatch( 'GET', self::ROUTE_VIDEOS )->get_data();

		$this->assertTrue( $data['videos'][0]['already_imported'] );
		$this->assertIsInt( $data['videos'][0]['attachment_id'] );
		$this->assertGreaterThan( 0, $data['videos'][0]['attachment_id'] );
		$this->assertFalse( $data['videos'][1]['already_imported'] );
		$this->assertNull( $data['videos'][1]['attachment_id'] );
	}

	/**
	 * Tests the core import path: the 202 queued snapshot, and the draft
	 * placeholder's full representation (mime, status, meta blob, lookup
	 * key, awaiting_media marker, thumbnail URL fallback).
	 */
	public function test_post_creates_draft_placeholders_with_meta() {
		$this->setup_environment();
		$fixture_videos = $this->get_fixture_videos();
		$video          = $fixture_videos[0];

		$response = $this->post_import( array( $video['external_id'] ) );
		$this->assertSame( 202, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsString( $data['job_id'] );
		$this->assertSame(
			array(
				array(
					'external_id' => $video['external_id'],
					'status'      => 'queued',
				),
			),
			$data['items']
		);

		// The synchronous v1 has already finished by response time.
		$job = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/' . $data['job_id'] )->get_data();
		$this->assertSame( 'done', $job['status'] );
		$attachment_id = $job['items'][0]['attachment_id'];
		$this->assertIsInt( $attachment_id );

		$attachment = get_post( $attachment_id );
		$this->assertSame( 'attachment', $attachment->post_type );
		$this->assertSame( 'inherit', $attachment->post_status );
		$this->assertSame( Import_Rest_Controller::DRAFT_MIME_TYPE, $attachment->post_mime_type );
		$this->assertSame( $video['title'], $attachment->post_title );

		$blob = get_post_meta( $attachment_id, Import_Rest_Controller::META_IMPORT, true );
		$this->assertSame( 'youtube', $blob['source'] );
		$this->assertSame( $video['external_id'], $blob['external_id'] );
		$this->assertSame( $video['title'], $blob['title'] );
		$this->assertSame( $video['description'], $blob['description'] );
		$this->assertSame( $video['tags'], $blob['tags'] );
		$this->assertSame( $video['duration_seconds'], $blob['duration_seconds'] );
		$this->assertSame( $video['privacy'], $blob['privacy'] );
		$this->assertSame( $video['published_at'], $blob['published_at'] );
		// Best thumbnail is maxres for this fixture; HTTP is blocked in
		// tests, so the sideload falls back to URL-only.
		$this->assertSame( $video['thumbnails']['maxres'], $blob['thumbnail_url'] );
		$this->assertSame( 0, $blob['thumbnail_attachment_id'] );

		$this->assertSame(
			'youtube:' . $video['external_id'],
			get_post_meta( $attachment_id, Import_Rest_Controller::META_IMPORT_EXTERNAL_ID, true )
		);
		$this->assertSame(
			Import_Rest_Controller::STATUS_AWAITING_MEDIA,
			get_post_meta( $attachment_id, Import_Rest_Controller::META_IMPORT_STATUS, true )
		);
	}

	/**
	 * Tests the status lifecycle: mixed success/failure jobs finish 'done'
	 * with per-item errors, all-failure jobs finish 'failed', and unknown
	 * jobs are 404.
	 */
	public function test_status_lifecycle_mixed_and_failed_jobs() {
		$this->setup_environment();
		$fixture_videos = $this->get_fixture_videos();

		// Mixed: one real fixture ID, one the channel does not have.
		$data = $this->post_import( array( $fixture_videos[0]['external_id'], 'NoSuchVid99' ) )->get_data();
		$job  = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/' . $data['job_id'] )->get_data();

		$this->assertSame( 'done', $job['status'] );
		$this->assertSame( 'done', $job['items'][0]['status'] );
		$this->assertIsInt( $job['items'][0]['attachment_id'] );
		$this->assertNull( $job['items'][0]['error'] );
		$this->assertSame( 'failed', $job['items'][1]['status'] );
		$this->assertNull( $job['items'][1]['attachment_id'] );
		$this->assertSame( 'unknown_video', $job['items'][1]['error']['code'] );

		// Every item failing fails the job as a whole.
		$data = $this->post_import( array( 'NoSuchVid99' ) )->get_data();
		$job  = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/' . $data['job_id'] )->get_data();
		$this->assertSame( 'failed', $job['status'] );

		// Unknown (or expired) job IDs are a 404.
		$response = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/no-such-job' );
		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'import_job_not_found', $response->get_data()['code'] );
	}

	/** Tests that re-importing resolves to the existing placeholder instead of duplicating. */
	public function test_duplicate_import_is_idempotent() {
		$this->setup_environment();
		$external_id = $this->get_fixture_videos()[0]['external_id'];

		$first_job  = $this->post_import( array( $external_id ) )->get_data();
		$first_item = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/' . $first_job['job_id'] )->get_data()['items'][0];

		$second_job  = $this->post_import( array( $external_id ) )->get_data();
		$second_item = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/' . $second_job['job_id'] )->get_data()['items'][0];

		$this->assertSame( 'done', $second_item['status'] );
		$this->assertSame( $first_item['attachment_id'], $second_item['attachment_id'] );

		$placeholders = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 10,
				'fields'         => 'ids',
				'meta_key'       => Import_Rest_Controller::META_IMPORT_EXTERNAL_ID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => 'youtube:' . $external_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		$this->assertCount( 1, $placeholders );
	}

	/** Tests that malformed video_ids payloads are rejected by the schema. */
	public function test_post_rejects_invalid_video_ids() {
		$this->setup_environment();

		// Empty list violates minItems.
		$response = $this->dispatch( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => array() ) );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );

		// IDs outside the YouTube alphabet violate the item pattern.
		$response = $this->dispatch( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => array( 'not a video id!' ) ) );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/** Tests that logged-out and capability-less users are denied on every route. */
	public function test_permission_denied_below_upload_files() {
		$this->setup_environment();

		// Logged out: 401.
		wp_set_current_user( 0 );
		$this->assertSame( 401, $this->dispatch( 'GET', self::ROUTE_CONNECTION )->get_status() );
		$this->assertSame( 401, $this->dispatch( 'GET', self::ROUTE_VIDEOS )->get_status() );
		$this->assertSame( 401, $this->dispatch( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => array( 'k3xPn0qLmA1' ) ) )->get_status() );
		$this->assertSame( 401, $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/some-job' )->get_status() );

		// Logged in without upload_files: 403.
		wp_set_current_user( $this->create_user_with_role( 'subscriber' ) );
		$this->assertSame( 403, $this->dispatch( 'GET', self::ROUTE_CONNECTION )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'GET', self::ROUTE_VIDEOS )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => array( 'k3xPn0qLmA1' ) ) )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/some-job' )->get_status() );
	}

	/**
	 * Tests that turning mock mode off yields 501 on every backend-shaped
	 * endpoint, while the backend-agnostic status route keeps working.
	 */
	public function test_mock_mode_off_returns_501() {
		$this->setup_environment();
		add_filter( 'videopress_import_mock_mode', '__return_false' );

		foreach ( array(
			array( 'GET', self::ROUTE_CONNECTION, null ),
			array( 'DELETE', self::ROUTE_CONNECTION, null ),
			array( 'GET', self::ROUTE_VIDEOS, null ),
			array( 'POST', self::ROUTE_IMPORT, array( 'video_ids' => array( 'k3xPn0qLmA1' ) ) ),
		) as $case ) {
			list( $method, $path, $body ) = $case;
			$response                     = $this->dispatch( $method, $path, $body );
			$this->assertSame( 501, $response->get_status(), "{$method} {$path} should be 501 outside mock mode." );
			$this->assertSame( 'not_implemented', $response->get_data()['code'] );
		}

		// Job records are local: the status route is not mock-gated.
		$response = $this->dispatch( 'GET', '/jetpack/v4/videopress/import/status/no-such-job' );
		$this->assertSame( 404, $response->get_status() );
	}
}
