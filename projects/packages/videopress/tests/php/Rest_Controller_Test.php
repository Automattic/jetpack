<?php
/**
 * Tests for the Rest_Controller per-video stats proxy route.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the `/jetpack/v4/videopress/stats/video/{post_id}` REST route.
 */
class Rest_Controller_Test extends BaseTestCase {

	/**
	 * Route key as it appears in the REST server's route table.
	 *
	 * @var string
	 */
	const STATS_VIDEO_ROUTE = '/jetpack/v4/videopress/stats/video/(?P<post_id>\d+)';

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Test admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * URL of the last WPCOM request captured by the HTTP mock.
	 *
	 * @var string|null
	 */
	private $last_wpcom_url;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => 'password',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		// Mock a blog-level Jetpack connection; the proxy is blog-signed.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		$this->last_wpcom_url = null;

		Rest_Controller::init();
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
		Constants::clear_constants();
	}

	/**
	 * Dispatches a GET request to the per-video stats route.
	 *
	 * @param int   $post_id Video post ID for the route path.
	 * @param array $params  Extra query params.
	 * @return \WP_REST_Response The response object.
	 */
	private function get_stats_video( $post_id, array $params = array() ) {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/videopress/stats/video/' . $post_id );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $this->server->dispatch( $request );
	}

	/**
	 * Returns a mock 200 WPCOM response, capturing the requested URL.
	 *
	 * @param false|array|\WP_Error $preempt Whether to preempt the request.
	 * @param array                 $args    Request arguments.
	 * @param string                $url     Request URL.
	 * @return array Mock HTTP response.
	 */
	public function mock_wpcom_video_stats_response( $preempt, $args, $url ) {
		$this->last_wpcom_url = $url;

		return array(
			'body'     => wp_json_encode(
				array(
					'data'  => array( array( '2026-07-01', 42 ) ),
					'pages' => array( 'https://example.com/a-post-embedding-the-video/' ),
				),
				JSON_UNESCAPED_SLASHES
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Test that the per-video stats route is registered.
	 */
	public function test_stats_video_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::STATS_VIDEO_ROUTE, $routes );
	}

	/**
	 * Test that logged-out requests are denied.
	 */
	public function test_stats_video_denies_logged_out_request() {
		wp_set_current_user( 0 );

		$response = $this->get_stats_video( 123 );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that logged-in users without manage_options are denied.
	 */
	public function test_stats_video_denies_non_admin_request() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$response = $this->get_stats_video( 123 );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test that an invalid period is rejected before proxying.
	 */
	public function test_stats_video_rejects_invalid_period() {
		$response = $this->get_stats_video( 123, array( 'period' => 'hourly' ) );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Test that an out-of-range num is rejected before proxying.
	 */
	public function test_stats_video_rejects_out_of_range_num() {
		$response = $this->get_stats_video( 123, array( 'num' => 0 ) );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );

		$response = $this->get_stats_video( 123, array( 'num' => 366 ) );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Test that a valid request proxies to the WPCOM v1.1 per-video stats
	 * endpoint (with the default period/num applied) and passes the
	 * upstream body through untouched.
	 */
	public function test_stats_video_proxies_wpcom_response() {
		$mock = array( $this, 'mock_wpcom_video_stats_response' );
		add_filter( 'pre_http_request', $mock, 10, 3 );
		$response = $this->get_stats_video( 123 );
		remove_filter( 'pre_http_request', $mock, 10 );

		$this->assertEquals( 200, $response->get_status() );

		$this->assertNotNull( $this->last_wpcom_url );
		$this->assertStringContainsString( '/rest/v1.1/sites/1234/stats/video/123', $this->last_wpcom_url );
		$this->assertStringContainsString( 'period=day', $this->last_wpcom_url );
		$this->assertStringContainsString( 'num=30', $this->last_wpcom_url );

		$data = $response->get_data();
		$this->assertSame( array( array( '2026-07-01', 42 ) ), $data['data'] );
		$this->assertSame( array( 'https://example.com/a-post-embedding-the-video/' ), $data['pages'] );
	}
}
