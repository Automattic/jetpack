<?php
/**
 * Tests for Posts_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Posts_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Public_Api_Controller
 */
#[CoversClass( Posts_Controller::class )]
#[CoversClass( Public_Api_Controller::class )]
class Posts_Controller_Test extends BaseTestCase {

	/**
	 * Controller under test.
	 *
	 * @var Posts_Controller
	 */
	private $controller;

	/**
	 * The URL the stubbed transport last saw.
	 *
	 * @var string
	 */
	private $requested_url = '';

	/**
	 * Set up the controller, a fresh REST server, and a known blog id.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Posts_Controller();
		Jetpack_Options::update_option( 'id', 1234 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function tear_down() {
		$this->requested_url = '';
		remove_all_filters( 'pre_http_request' );
		Constants::clear_constants();
		parent::tear_down();
	}

	public function test_registers_the_posts_route() {
		$this->assertArrayHasKey( '/jetpack-premium-analytics/v1/posts', rest_get_server()->get_routes() );
	}

	public function test_route_is_read_only_and_uses_the_controller_callbacks() {
		$handler = rest_get_server()->get_routes()['/jetpack-premium-analytics/v1/posts'][0];

		$this->assertArrayHasKey( 'GET', $handler['methods'] );
		$this->assertArrayNotHasKey( 'POST', $handler['methods'] );
		$this->assertSame( array( $this->controller, 'get_items' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $handler['permission_callback'] );
	}

	public function test_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_posts_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_denied_for_anonymous_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_permission() );
	}

	public function test_get_items_requests_v1_1_posts_with_force_wpcom() {
		$this->stub_http( 200, array( 'posts' => array() ) );

		$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/posts' );
		$request->set_query_params( array( 'number' => '5' ) );
		$this->controller->get_items( $request );

		$this->assertStringContainsString( 'https://public-api.wordpress.com/rest/v1.1/sites/1234/posts?', $this->requested_url );
		$this->assertStringContainsString( 'force=wpcom', $this->requested_url );
		$this->assertStringContainsString( 'number=5', $this->requested_url );
	}

	public function test_get_items_returns_decoded_body_on_success() {
		$this->stub_http( 200, array( 'found' => 2 ) );

		$result = $this->controller->get_items( new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/posts' ) );

		$this->assertSame( 2, $result['found'] );
	}

	public function test_get_items_maps_remote_error_to_wp_error() {
		$this->stub_http(
			403,
			array(
				'error'   => 'unauthorized',
				'message' => 'nope',
			)
		);

		$result = $this->controller->get_items( new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/posts' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'remote-error-unauthorized', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Stub the outbound HTTP request, capturing the URL and returning a canned response.
	 *
	 * @param int   $status Response status code.
	 * @param array $body   Response body (JSON-encoded into the response).
	 */
	private function stub_http( int $status, array $body ): void {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $status, $body ) {
				$this->requested_url = $url;
				return array(
					'response' => array( 'code' => $status ),
					'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
					'headers'  => array(),
				);
			},
			10,
			3
		);
	}
}
