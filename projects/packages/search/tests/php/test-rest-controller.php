<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_REST_Controller extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * An Admin user id
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * An Editor user id
	 *
	 * @var int
	 */
	private $editor_id;

	/**
	 * An instance of REST_Controller
	 *
	 * @var REST_Controller
	 */
	private $rest_controller;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		$wp_rest_server  = new WP_REST_Server();
		$this->server    = $wp_rest_server;
		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'dummy_user_1',
				'user_pass'  => 'dummy_pass_1',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		$this->rest_controller = new REST_Controller();

		// Register REST routes.
		add_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );

		do_action( 'rest_api_init' );

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan` endpoint with editor user.
	 */
	public function test_search_plan_unauthorized() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/plan' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan` endpoint with editor user.
	 */
	public function test_search_plan_successful_authorization() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/plan' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		// The request is not actually successfully forwarded to WPCOM as the blog is not properly connected.
		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_unauthorized() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'module_status'          => true,
					'instant_search_enabled' => true,
				)
			)
		);
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_success() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'module_status'          => true,
			'instant_search_enabled' => true,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $new_settings, $response->get_data() );
		$this->assertArrayHasKey( 'module_status', $response->get_data() );
		$this->assertArrayHasKey( 'instant_search_enabled', $response->get_data() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_get_search_settings_unauthorized() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'You are not allowed to perform this action.', $response->get_data()['message'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_get_search_settings_success() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'module_status', $response->get_data() );
		$this->assertArrayHasKey( 'instant_search_enabled', $response->get_data() );
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 * Site-level connection set-up.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'new.blogtoken';
			case 'id':
				return '999';
		}

		return $value;
	}

}
