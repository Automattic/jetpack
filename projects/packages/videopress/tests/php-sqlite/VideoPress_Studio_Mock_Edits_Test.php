<?php
/**
 * Tests for the Studio edits REST endpoints: registration/gating of both
 * backends (the default WPCOM proxy and the opt-in development mock) plus the
 * mock's full behavioral contract.
 *
 * Lives in the sqlite suite (tests/php-sqlite) because the guid → attachment
 * lookup (videopress_get_post_id_by_guid) runs a WP_Query meta_query, which
 * needs real database tables. Like Playlists_Test, this deliberately does NOT
 * extend WorDBless\BaseTestCase: its teardown instantiates the dbless module
 * singletons, whose hooks would corrupt real sqlite inserts in later tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Tokens;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_REST_Request;
use WP_REST_Server;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test suite for the VideoPress_Studio_Mock_Edits class.
 */
class VideoPress_Studio_Mock_Edits_Test extends TestCase {

	const ROUTE_EDITS      = '/wpcom/v2/videopress/(?P<guid>\w+)/edits';
	const ROUTE_STORYBOARD = '/wpcom/v2/videopress/(?P<guid>\w+)/storyboard';

	/**
	 * Master duration used for the test attachment, in ms.
	 *
	 * @var int
	 */
	const DURATION_MS = 60000;

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Attachment IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $attachment_ids = array();

	/**
	 * User IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * GUIDs created during the current test, for transient cleanup.
	 *
	 * @var string[]
	 */
	private $guids = array();

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Mock edits tests need real tables for the guid meta_query lookup; run them via the sqlite test suite (composer phpunit).' );
		}
	}

	/**
	 * Clean up after each test.
	 *
	 * The sqlite database persists across tests and runs, so every entity a
	 * test creates is tracked and deleted here, and global state (filters,
	 * options, connection mocks, caches) is reset.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );

		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$this->attachment_ids = array();

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = array();

		foreach ( $this->guids as $guid ) {
			delete_transient( 'videopress_get_post_id_by_guid_' . $guid );
			delete_option( VideoPress_Studio_Mock_Edits::OPTION_NAME . '_' . $guid );
		}
		$this->guids = array();
		\Jetpack_Options::delete_option( array( 'blog_token', 'id', 'master_user', 'user_tokens' ) );

		remove_all_filters( Admin_UI::STUDIO_FILTER );
		remove_all_filters( 'videopress_studio_mock_edits' );
		remove_all_filters( 'videopress_studio_mock_edits_delay' );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_cache_flush();

		parent::tear_down();
	}

	/**
	 * Create a fresh REST server, construct both edits backends (mock and
	 * WPCOM proxy — their should_register() gates make them mutually
	 * exclusive, mirroring the Initializer), and fire rest_api_init so the
	 * routes (maybe) register.
	 *
	 * @return WP_REST_Server
	 */
	private function initialize_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		new VideoPress_Studio_Mock_Edits();
		new WPCOM_REST_API_V2_Endpoint_VideoPress_Edits();
		do_action( 'rest_api_init' );

		return $wp_rest_server;
	}

	/**
	 * Assert both routes are registered and every handler belongs to the
	 * given backend class.
	 *
	 * @param WP_REST_Server $server     The REST server.
	 * @param string         $class_name Expected handling class.
	 */
	private function assert_routes_handled_by( $server, $class_name ) {
		$routes = $server->get_routes();

		foreach ( array( self::ROUTE_EDITS, self::ROUTE_STORYBOARD ) as $route ) {
			$this->assertArrayHasKey( $route, $routes );
			foreach ( $routes[ $route ] as $handler ) {
				$this->assertInstanceOf( $class_name, $handler['callback'][0] );
			}
		}
	}

	/**
	 * Create a user with the given role. Logins are unique per call because
	 * the sqlite database persists across tests and runs.
	 *
	 * @param string $role The user role.
	 * @return int The new user ID.
	 */
	private function create_user_with_role( $role ) {
		$login   = 'vps_mock_edits_' . $role . '_' . uniqid();
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
	 * Mock a Jetpack connection with a connected owner and connect the given
	 * user, so Data::can_perform_action() passes for them.
	 *
	 * @param int $user_id The user to connect (also becomes the master user).
	 */
	private function mock_connection_for_user( $user_id ) {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		( new Tokens() )->update_user_token( $user_id, sprintf( '%s.%s.%d', 'key', 'private', $user_id ), false );
	}

	/**
	 * Create a VideoPress attachment carrying a guid and a master duration.
	 *
	 * @return string The video GUID.
	 */
	private function create_video_with_guid() {
		$guid          = 'mockguid' . uniqid();
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Editable video ' . $guid,
			)
		);
		$this->assertIsInt( $attachment_id );
		$this->assertGreaterThan( 0, $attachment_id );
		$this->attachment_ids[] = $attachment_id;
		$this->guids[]          = $guid;

		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata( $attachment_id, array( 'videopress' => array( 'duration' => self::DURATION_MS ) ) );

		return $guid;
	}

	/**
	 * Full environment for the happy-path tests: Studio flag on, connected
	 * author as the current user, one editable video, routes registered.
	 *
	 * @return string The video GUID.
	 */
	private function setup_environment() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		// The mock is opt-in since the WPCOM proxy became the default backend.
		add_filter( 'videopress_studio_mock_edits', '__return_true' );

		$user_id = $this->create_user_with_role( 'author' );
		$this->mock_connection_for_user( $user_id );
		wp_set_current_user( $user_id );

		$guid = $this->create_video_with_guid();
		$this->initialize_rest_server();

		return $guid;
	}

	/**
	 * Dispatch a request against the edits/storyboard routes.
	 *
	 * @param string     $method HTTP method.
	 * @param string     $path   Request path.
	 * @param array|null $body   JSON body, if any.
	 * @return \WP_REST_Response The response.
	 */
	private function dispatch( $method, $path, $body = null ) {
		$request = new WP_REST_Request( $method, $path );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return $this->server->dispatch( $request );
	}

	/** Tests that no routes register (mock or proxy) while the Studio flag is off. */
	public function test_routes_not_registered_when_studio_flag_off() {
		$server = $this->initialize_rest_server();

		$this->assertArrayNotHasKey( self::ROUTE_EDITS, $server->get_routes() );
		$this->assertArrayNotHasKey( self::ROUTE_STORYBOARD, $server->get_routes() );
	}

	/** Tests that neither backend registers with Studio off even when the mock is opted into. */
	public function test_routes_not_registered_when_studio_flag_off_with_mock_opt_in() {
		add_filter( 'videopress_studio_mock_edits', '__return_true' );

		$server = $this->initialize_rest_server();

		$this->assertArrayNotHasKey( self::ROUTE_EDITS, $server->get_routes() );
		$this->assertArrayNotHasKey( self::ROUTE_STORYBOARD, $server->get_routes() );
	}

	/** Tests that the WPCOM proxy serves the routes by default when Studio is on. */
	public function test_proxy_routes_registered_by_default_when_studio_on() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		$server = $this->initialize_rest_server();

		$this->assert_routes_handled_by( $server, WPCOM_REST_API_V2_Endpoint_VideoPress_Edits::class );
	}

	/** Tests that opting into the mock filter hands the routes to the mock instead. */
	public function test_mock_routes_registered_when_opted_in() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		add_filter( 'videopress_studio_mock_edits', '__return_true' );

		$server = $this->initialize_rest_server();

		$this->assert_routes_handled_by( $server, VideoPress_Studio_Mock_Edits::class );
	}

	/**
	 * Full lifecycle: pristine GET → POST (202, processing) → GET while
	 * processing (uncommitted) → delay elapses → GET (complete, committed).
	 */
	public function test_full_lifecycle_post_processing_complete() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		// Pristine state.
		$response = $this->dispatch( 'GET', $path );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( $guid, $data['guid'] );
		$this->assertSame( 0, $data['revision'] );
		$this->assertSame( self::DURATION_MS, $data['original_duration_ms'] );
		$this->assertSame( self::DURATION_MS, $data['output_duration_ms'] );
		$this->assertSame( array(), $data['operations'] );
		$this->assertFalse( $data['can_restore_original'] );
		$this->assertSame(
			array(
				'id'              => null,
				'status'          => 'idle',
				'target_revision' => null,
				'progress'        => null,
				'error'           => null,
			),
			$data['job']
		);
		$this->assertIsString( $data['updated'] );
		$this->assertNotFalse( strtotime( $data['updated'] ) );

		// Save: trim plus two cuts, deliberately out of order.
		$operations = array(
			array(
				'type'     => 'trim',
				'start_ms' => 1000,
				'end_ms'   => 50000,
			),
			array(
				'type'     => 'cut',
				'start_ms' => 20000,
				'end_ms'   => 25000,
			),
			array(
				'type'     => 'cut',
				'start_ms' => 5000,
				'end_ms'   => 8000,
			),
		);

		$response = $this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => $operations,
			)
		);
		$this->assertSame( 202, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( $guid, $data['guid'] );
		$this->assertSame( 0, $data['revision'], 'The 202 revision is the one the job was based on.' );
		$this->assertSame( 'processing', $data['job']['status'] );
		$this->assertSame( 1, $data['job']['target_revision'] );
		$this->assertIsString( $data['job']['id'] );
		$this->assertIsFloat( $data['job']['progress'] );
		$this->assertGreaterThanOrEqual( 0.0, $data['job']['progress'] );
		$this->assertLessThan( 1.0, $data['job']['progress'] );
		$this->assertNull( $data['job']['error'] );

		// Still processing (default delay is 10s): nothing committed yet.
		$response = $this->dispatch( 'GET', $path );
		$data     = $response->get_data();
		$this->assertSame( 0, $data['revision'] );
		$this->assertSame( array(), $data['operations'] );
		$this->assertSame( 'processing', $data['job']['status'] );
		$this->assertLessThanOrEqual( 0.99, $data['job']['progress'] );

		// Let the lazy promotion fire on the next request.
		add_filter( 'videopress_studio_mock_edits_delay', '__return_zero' );

		$response = $this->dispatch( 'GET', $path );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 1, $data['revision'] );
		$this->assertSame( 'complete', $data['job']['status'] );
		$this->assertSame( 1, $data['job']['target_revision'] );
		$this->assertNull( $data['job']['progress'] );
		$this->assertNull( $data['job']['error'] );
		$this->assertTrue( $data['can_restore_original'] );

		// Operations come back canonical: trim first, cuts sorted by start.
		$this->assertSame(
			array(
				array(
					'type'     => 'trim',
					'start_ms' => 1000,
					'end_ms'   => 50000,
				),
				array(
					'type'     => 'cut',
					'start_ms' => 5000,
					'end_ms'   => 8000,
				),
				array(
					'type'     => 'cut',
					'start_ms' => 20000,
					'end_ms'   => 25000,
				),
			),
			$data['operations']
		);

		// Trim window 49000ms minus 3000ms + 5000ms of cuts.
		$this->assertSame( 41000, $data['output_duration_ms'] );
	}

	/** Tests that a stale base_revision is rejected with 409 edits_conflict. */
	public function test_post_with_stale_base_revision_conflicts() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		add_filter( 'videopress_studio_mock_edits_delay', '__return_zero' );

		$trim = array(
			array(
				'type'     => 'trim',
				'start_ms' => 0,
				'end_ms'   => 30000,
			),
		);
		$this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => $trim,
			)
		);
		// Promote the job (delay 0), moving the server to revision 1.
		$this->dispatch( 'GET', $path );

		$response = $this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => array(),
			)
		);
		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'edits_conflict', $response->get_data()['code'] );
	}

	/** Tests that a second save while a job is processing gets 409. */
	public function test_post_while_job_processing_conflicts() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		$body = array(
			'base_revision' => 0,
			'operations'    => array(
				array(
					'type'     => 'trim',
					'start_ms' => 0,
					'end_ms'   => 30000,
				),
			),
		);

		$response = $this->dispatch( 'POST', $path, $body );
		$this->assertSame( 202, $response->get_status() );

		$response = $this->dispatch( 'POST', $path, $body );
		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'edits_job_in_progress', $response->get_data()['code'] );

		// The restore route conflicts on a processing job too.
		$response = $this->dispatch( 'DELETE', $path );
		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'edits_job_in_progress', $response->get_data()['code'] );
	}

	/**
	 * Data provider of invalid operations lists.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_operations_provider() {
		return array(
			'overlapping cuts'          => array(
				array(
					array(
						'type'     => 'cut',
						'start_ms' => 5000,
						'end_ms'   => 12000,
					),
					array(
						'type'     => 'cut',
						'start_ms' => 10000,
						'end_ms'   => 15000,
					),
				),
			),
			'two trims'                 => array(
				array(
					array(
						'type'     => 'trim',
						'start_ms' => 0,
						'end_ms'   => 30000,
					),
					array(
						'type'     => 'trim',
						'start_ms' => 1000,
						'end_ms'   => 20000,
					),
				),
			),
			'cut outside trim window'   => array(
				array(
					array(
						'type'     => 'trim',
						'start_ms' => 10000,
						'end_ms'   => 30000,
					),
					array(
						'type'     => 'cut',
						'start_ms' => 5000,
						'end_ms'   => 12000,
					),
				),
			),
			'start not before end'      => array(
				array(
					array(
						'type'     => 'cut',
						'start_ms' => 12000,
						'end_ms'   => 12000,
					),
				),
			),
			'end past master duration'  => array(
				array(
					array(
						'type'     => 'trim',
						'start_ms' => 0,
						'end_ms'   => self::DURATION_MS + 1,
					),
				),
			),
			'negative start'            => array(
				array(
					array(
						'type'     => 'cut',
						'start_ms' => -1,
						'end_ms'   => 5000,
					),
				),
			),
			'non-integer milliseconds'  => array(
				array(
					array(
						'type'     => 'cut',
						'start_ms' => 5000.5,
						'end_ms'   => 9000,
					),
				),
			),
			'unknown operation type'    => array(
				array(
					array(
						'type'     => 'splice',
						'start_ms' => 5000,
						'end_ms'   => 9000,
					),
				),
			),
			'operations not a list'     => array( 'nonsense' ),
			'operation missing timings' => array(
				array(
					array( 'type' => 'cut' ),
				),
			),
		);
	}

	/**
	 * Tests that invalid operations lists get 400 edits_invalid_operations.
	 *
	 * @param mixed $operations The invalid operations payload.
	 *
	 * @dataProvider invalid_operations_provider
	 */
	#[DataProvider( 'invalid_operations_provider' )]
	public function test_post_invalid_operations( $operations ) {
		$guid = $this->setup_environment();

		$response = $this->dispatch(
			'POST',
			'/wpcom/v2/videopress/' . $guid . '/edits',
			array(
				'base_revision' => 0,
				'operations'    => $operations,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'edits_invalid_operations', $response->get_data()['code'] );
	}

	/** Tests that an output under 1000ms is rejected with 422. */
	public function test_post_output_too_short() {
		$guid = $this->setup_environment();

		$response = $this->dispatch(
			'POST',
			'/wpcom/v2/videopress/' . $guid . '/edits',
			array(
				'base_revision' => 0,
				'operations'    => array(
					array(
						'type'     => 'trim',
						'start_ms' => 0,
						'end_ms'   => 999,
					),
				),
			)
		);

		$this->assertSame( 422, $response->get_status() );
		$this->assertSame( 'edits_output_too_short', $response->get_data()['code'] );
	}

	/** Tests that DELETE restores the original and still bumps the revision. */
	public function test_delete_restores_original() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		add_filter( 'videopress_studio_mock_edits_delay', '__return_zero' );

		// Commit a trim first, so there is something to restore from.
		$this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => array(
					array(
						'type'     => 'trim',
						'start_ms' => 1000,
						'end_ms'   => 30000,
					),
				),
			)
		);
		$data = $this->dispatch( 'GET', $path )->get_data();
		$this->assertSame( 1, $data['revision'] );
		$this->assertTrue( $data['can_restore_original'] );

		$response = $this->dispatch( 'DELETE', $path );
		$this->assertSame( 202, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 1, $data['revision'] );
		$this->assertSame( 'processing', $data['job']['status'] );
		$this->assertSame( 2, $data['job']['target_revision'] );

		// After promotion: empty operations, full-length output, higher revision.
		$data = $this->dispatch( 'GET', $path )->get_data();
		$this->assertSame( 2, $data['revision'] );
		$this->assertSame( 'complete', $data['job']['status'] );
		$this->assertSame( array(), $data['operations'] );
		$this->assertSame( self::DURATION_MS, $data['output_duration_ms'] );
		$this->assertFalse( $data['can_restore_original'] );
	}

	/** Tests that logged-out and capability-less users are denied. */
	public function test_permission_denied_for_logged_out_and_subscriber() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		// Logged out: 401 on every method.
		wp_set_current_user( 0 );
		$this->assertSame( 401, $this->dispatch( 'GET', $path )->get_status() );
		$this->assertSame(
			401,
			$this->dispatch(
				'POST',
				$path,
				array(
					'base_revision' => 0,
					'operations'    => array(),
				)
			)->get_status()
		);
		$this->assertSame( 401, $this->dispatch( 'DELETE', $path )->get_status() );
		$this->assertSame( 401, $this->dispatch( 'GET', '/wpcom/v2/videopress/' . $guid . '/storyboard' )->get_status() );

		// Logged in without upload_files (and without a user connection): 403.
		wp_set_current_user( $this->create_user_with_role( 'subscriber' ) );
		$this->assertSame( 403, $this->dispatch( 'GET', $path )->get_status() );
	}

	/** Tests that the storyboard mock is always a 404. */
	public function test_storyboard_unavailable() {
		$guid = $this->setup_environment();

		$response = $this->dispatch( 'GET', '/wpcom/v2/videopress/' . $guid . '/storyboard' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'storyboard_unavailable', $response->get_data()['code'] );
	}

	/** Tests that an unknown guid is a 404 on the edits route. */
	public function test_unknown_guid_is_404() {
		$this->setup_environment();

		$response = $this->dispatch( 'GET', '/wpcom/v2/videopress/nosuchguid123/edits' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'edits_video_not_found', $response->get_data()['code'] );
	}

	/**
	 * Tests the deterministic failure path: a cut starting at exactly 13000ms
	 * fails the job with transcode_failed and commits nothing.
	 */
	public function test_failing_cut_marks_job_failed() {
		$guid = $this->setup_environment();
		$path = '/wpcom/v2/videopress/' . $guid . '/edits';

		$response = $this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => array(
					array(
						'type'     => 'cut',
						'start_ms' => 13000,
						'end_ms'   => 15000,
					),
				),
			)
		);
		$this->assertSame( 202, $response->get_status() );
		$this->assertSame( 'processing', $response->get_data()['job']['status'] );

		add_filter( 'videopress_studio_mock_edits_delay', '__return_zero' );

		$data = $this->dispatch( 'GET', $path )->get_data();
		$this->assertSame( 'failed', $data['job']['status'] );
		$this->assertSame( 'transcode_failed', $data['job']['error']['code'] );
		$this->assertIsString( $data['job']['error']['message'] );
		// Nothing was committed.
		$this->assertSame( 0, $data['revision'] );
		$this->assertSame( array(), $data['operations'] );
		$this->assertFalse( $data['can_restore_original'] );

		// A failed job is not "in progress": the client can retry immediately.
		$response = $this->dispatch(
			'POST',
			$path,
			array(
				'base_revision' => 0,
				'operations'    => array(
					array(
						'type'     => 'cut',
						'start_ms' => 14000,
						'end_ms'   => 16000,
					),
				),
			)
		);
		$this->assertSame( 202, $response->get_status() );
	}
}
