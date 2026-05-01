<?php

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Publicize\REST_API\Render_Message_Controller;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the Render_Message_Controller class.
 *
 * These exercise the self-hosted (proxy) code path — the WPCOM path requires
 * wp.com-only libraries and is tested in a8c-sandbox.
 *
 * @package automattic/jetpack-publicize
 */
class Render_Message_Controller_Test extends TestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Post ID used in the tests.
	 *
	 * @var int
	 */
	private $post_id;

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		$this->post_id = wp_insert_post(
			array(
				'post_title'   => 'Hello World',
				'post_content' => 'Body',
				'post_status'  => 'publish',
				'post_author'  => $this->admin_id,
			)
		);

		// Mock site connection for the proxy path.
		( new Tokens() )->update_blog_token( 'new.blogtoken' );
		Jetpack_Options::update_option( 'id', get_current_blog_id() );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_action( 'rest_api_init', array( new Render_Message_Controller(), 'register_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		unset( $_SERVER['REQUEST_METHOD'] );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Request without authentication is rejected.
	 */
	public function test_render_message_without_permission() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$request->set_body_params(
			array(
				'post_id' => $this->post_id,
				'network' => 'x',
				'message' => '',
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Missing required parameters return a validation error.
	 */
	public function test_render_message_missing_params() {
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_missing_callback_param', $response->as_error()->get_error_code() );
	}

	/**
	 * Authenticated request without edit_post capability on the target post is rejected.
	 */
	public function test_render_message_without_post_edit_cap() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$request->set_body_params(
			array(
				'post_id' => $this->post_id,
				'network' => 'x',
			)
		);
		$response = $this->server->dispatch( $request );
		// rest_authorization_required_code() returns 403 when a user is logged in.
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Happy path: authenticated admin, request proxies to WPCOM and returns rendered message.
	 */
	public function test_render_message_proxies_to_wpcom() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$request->set_body_params(
			array(
				'post_id' => $this->post_id,
				'network' => 'x',
				'message' => '',
			)
		);

		add_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );
		$response = $this->server->dispatch( $request );
		remove_filter( 'pre_http_request', array( $this, 'mock_success_response' ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertSame(
			array( 'rendered_message' => 'Hello World\n\nBody\n\nhttps://example.com/post' ),
			$response->get_data()
		);
	}

	/**
	 * The is_social_post arg rejects values that aren't boolean-coercible.
	 */
	public function test_render_message_rejects_invalid_is_social_post() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$request->set_body_params(
			array(
				'post_id'        => $this->post_id,
				'network'        => 'x',
				'is_social_post' => 'not-a-bool',
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->as_error()->get_error_code() );
	}

	/**
	 * The char_limit arg rejects values below 1 (zero or negative caps make no sense).
	 */
	public function test_render_message_rejects_non_positive_char_limit() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/render-message' );
		$request->set_body_params(
			array(
				'post_id'    => $this->post_id,
				'network'    => 'x',
				'char_limit' => 0,
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->as_error()->get_error_code() );
	}

	/**
	 * Mocks a successful response from WPCOM for the proxy path.
	 */
	public function mock_success_response() {
		return array(
			'body'     => wp_json_encode(
				array( 'rendered_message' => 'Hello World\n\nBody\n\nhttps://example.com/post' ),
				JSON_UNESCAPED_SLASHES
			),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}
}
