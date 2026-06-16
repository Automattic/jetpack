<?php
/**
 * Tests for Single_Post_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Single_Post_Controller
 */
#[CoversClass( Single_Post_Controller::class )]
class Single_Post_Controller_Test extends BaseTestCase {

	/**
	 * Controller under test.
	 *
	 * @var Single_Post_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Single_Post_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function test_registers_the_single_post_route() {
		$this->assertArrayHasKey( '/jetpack-premium-analytics/v1/posts/(?P<resource_id>[\d]+)', rest_get_server()->get_routes() );
	}

	public function test_route_is_read_only_and_uses_the_controller_callbacks() {
		$handler = rest_get_server()->get_routes()['/jetpack-premium-analytics/v1/posts/(?P<resource_id>[\d]+)'][0];

		$this->assertArrayHasKey( 'GET', $handler['methods'] );
		$this->assertArrayNotHasKey( 'POST', $handler['methods'] );
		$this->assertSame( array( $this->controller, 'get_item' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $handler['permission_callback'] );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_post_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_post_viewer',
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

	public function test_get_item_returns_the_mapped_post_shape() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Hello Analytics',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_content' => 'Body',
			)
		);

		$response = $this->controller->get_item( $this->build_request( $post_id ) );

		$this->assertSame( $post_id, $response['ID'] );
		$this->assertSame( (int) \Jetpack_Options::get_option( 'id' ), $response['site_ID'] );
		$this->assertSame( 'Hello Analytics', $response['title'] );
		$this->assertSame( 'post', $response['type'] );
		$this->assertSame( 'publish', $response['status'] );
		$this->assertSame( get_permalink( $post_id ), $response['URL'] );
		$this->assertArrayHasKey( 'comment_count', $response['discussion'] );
		$this->assertArrayHasKey( 'URL', $response['post_thumbnail'] );
		$this->assertArrayNotHasKey( 'like_count', $response );
	}

	public function test_get_item_returns_404_for_a_missing_post() {
		$response = $this->controller->get_item( $this->build_request( 999999 ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'post_not_found', $response->get_error_code() );
		$this->assertSame( 404, $response->get_error_data()['status'] );
	}

	/**
	 * Build a request carrying a resource_id route param.
	 *
	 * @param int $resource_id Post id.
	 *
	 * @return WP_REST_Request
	 */
	private function build_request( int $resource_id ): WP_REST_Request {
		$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/posts/' . $resource_id );
		$request->set_param( 'resource_id', $resource_id );

		return $request;
	}
}
