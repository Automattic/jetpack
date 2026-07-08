<?php
/**
 * Tests for the VideoPress Rest_Controller video-plays proxy.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Tokens;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the `/jetpack/v4/videopress/stats/video-plays` proxy.
 */
class Rest_Controller_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * URL captured from the outbound WPCOM request.
	 *
	 * @var string|null
	 */
	private static $captured_url;

	/**
	 * The `jetpack_remote_request_url` closure, saved so it can be removed specifically.
	 *
	 * @var callable
	 */
	private $url_filter;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => 'password',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		// Mock a Jetpack connection so the blog-signed request can be built.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $this->user_id );
		( new Tokens() )->update_user_token( $this->user_id, sprintf( '%s.%s.%d', 'key', 'private', $this->user_id ), false );

		/*
		 * Capture the outbound WPCOM request URL. This filter fires before the
		 * request is signed, so it records the URL regardless of whether the
		 * (unconnected) test environment can complete the signed request.
		 */
		self::$captured_url = null;
		$this->url_filter   = static function ( $url ) {
			self::$captured_url = $url;
			return $url;
		};
		add_filter( 'jetpack_remote_request_url', $this->url_filter );

		Rest_Controller::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_remote_request_url', $this->url_filter );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );

		parent::tearDown();
	}

	/**
	 * Dispatches a GET request to the video-plays proxy with the given params.
	 *
	 * @param array $params Request query params.
	 * @return \WP_REST_Response The response object.
	 */
	private function get_video_plays( array $params = array() ) {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/videopress/stats/video-plays' );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $this->server->dispatch( $request );
	}

	/**
	 * Test that the REST route is registered.
	 */
	public function test_rest_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/videopress/stats/video-plays', $routes );
	}

	/**
	 * Test that requests from users without manage_options are rejected.
	 */
	public function test_unauthorized_request_rejected() {
		wp_set_current_user( 0 );

		$response = $this->get_video_plays();

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Regression test for VIDP-277: the proxied WPCOM request must bypass the
	 * Jetpack Stats module requirement so standalone VideoPress sites report.
	 */
	public function test_request_bypasses_stats_module_check() {
		$this->get_video_plays();

		$this->assertNotNull( self::$captured_url );
		$this->assertStringContainsString( 'check_stats_module=false', self::$captured_url );
	}

	/**
	 * Test that the proxy always forces complete-stats mode.
	 */
	public function test_request_forces_complete_stats() {
		$this->get_video_plays();

		$this->assertNotNull( self::$captured_url );
		$this->assertStringContainsString( 'complete_stats=true', self::$captured_url );
	}

	/**
	 * Test that allowed params are forwarded and empty ones are omitted.
	 */
	public function test_forwards_allowed_params() {
		$this->get_video_plays(
			array(
				'period' => 'week',
				'num'    => 7,
			)
		);

		$this->assertNotNull( self::$captured_url );
		$this->assertStringContainsString( 'period=week', self::$captured_url );
		$this->assertStringContainsString( 'num=7', self::$captured_url );
		$this->assertStringNotContainsString( 'start_date=', self::$captured_url );
	}

	/**
	 * Test that a disconnected site returns an error before any request.
	 */
	public function test_disconnected_site_returns_error() {
		\Jetpack_Options::delete_option( 'id' );

		$response = $this->get_video_plays();

		$this->assertEquals( 400, $response->get_status() );
		$this->assertNull( self::$captured_url );
	}
}
