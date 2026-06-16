<?php
/**
 * Tests for User_Feedback_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\User_Feedback_Controller
 */
#[CoversClass( User_Feedback_Controller::class )]
class User_Feedback_Controller_Test extends BaseTestCase {

	/**
	 * Controller under test.
	 *
	 * @var User_Feedback_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new User_Feedback_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function test_registers_a_post_route_with_the_controller_callbacks() {
		$route   = '/jetpack-premium-analytics/v1/jetpack-stats/user-feedback';
		$handler = rest_get_server()->get_routes()[ $route ][0] ?? null;

		$this->assertNotNull( $handler, 'The user-feedback route should be registered.' );
		$this->assertArrayHasKey( 'POST', $handler['methods'] );
		$this->assertArrayNotHasKey( 'GET', $handler['methods'], 'Feedback is write-only.' );
		$this->assertSame( array( $this->controller, 'submit_feedback' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $handler['permission_callback'] );
	}

	public function test_permission_granted_for_view_stats_and_denied_otherwise() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_feedback_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );
		$this->assertTrue( $this->controller->check_permission() );

		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_permission() );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_feedback_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_returns_403_when_not_connected() {
		$request  = new WP_REST_Request( 'POST', '/jetpack-premium-analytics/v1/jetpack-stats/user-feedback' );
		$response = $this->controller->submit_feedback( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'no_connection', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data()['status'] );
	}

	public function test_augment_body_injects_current_user_email_and_preserves_the_payload() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_feedback_author',
				'user_pass'  => 'password',
				'user_email' => 'feedback@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/jetpack-premium-analytics/v1/jetpack-stats/user-feedback' );
		$request->set_body( wp_json_encode( array( 'message' => 'hello' ), JSON_UNESCAPED_SLASHES ) );

		$body = $this->invoke_augment_body( $request );

		$this->assertSame( 'hello', $body['message'], 'the original body is preserved' );
		$this->assertSame( 'feedback@example.com', $body['user_email'], 'the current user email is injected' );
	}

	public function test_augment_body_overrides_a_client_supplied_email() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_feedback_spoof',
				'user_pass'  => 'password',
				'user_email' => 'real@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/jetpack-premium-analytics/v1/jetpack-stats/user-feedback' );
		$request->set_body( wp_json_encode( array( 'user_email' => 'spoofed@example.com' ), JSON_UNESCAPED_SLASHES ) );

		$body = $this->invoke_augment_body( $request );

		$this->assertSame( 'real@example.com', $body['user_email'], 'a client-supplied email cannot win' );
	}

	public function test_augment_body_tolerates_an_empty_body() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_feedback_empty',
				'user_pass'  => 'password',
				'user_email' => 'empty@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/jetpack-premium-analytics/v1/jetpack-stats/user-feedback' );

		$this->assertSame( array( 'user_email' => 'empty@example.com' ), $this->invoke_augment_body( $request ) );
	}

	/**
	 * Invoke the controller's private augment_body().
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array<string, mixed>
	 */
	private function invoke_augment_body( WP_REST_Request $request ): array {
		$accessor = function ( WP_REST_Request $req ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->augment_body( $req );
		};

		return $accessor->call( $this->controller, $request );
	}
}
