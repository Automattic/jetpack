<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\Test_Case as Search_Test_Case;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_REST_Controller extends Search_Test_Case {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * An instance of REST_Controller
	 *
	 * @var REST_Controller
	 */
	protected $rest_controller;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		wp_set_current_user( 0 );

		$plan = $this->createMock( Plan::class );
		$plan->method( 'supports_search' )->willReturn( true );

		$this->rest_controller = new REST_Controller( false, new Module_Control( $plan ) );

		// Register REST routes.
		add_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );

		do_action( 'rest_api_init' );

	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		remove_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );
		parent::tear_down();
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
		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['supports_search'] );
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
					'module_active'          => true,
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
	public function test_update_search_settings_success_both_enable() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'module_active'          => true,
			'instant_search_enabled' => true,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $new_settings, $response->get_data() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_invalid_request_1() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'module_active'          => false,
			'instant_search_enabled' => true,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

		/**
		 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
		 */
	public function test_update_search_settings_invalid_request_2() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_success_both_disable() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'module_active'          => false,
			'instant_search_enabled' => false,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $new_settings, $response->get_data() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_success_disable_module_only() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'module_active' => false,
		);
		$expected     = array(
			'module_active'          => false,
			'instant_search_enabled' => false,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $expected, $response->get_data() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with editor user.
	 */
	public function test_update_search_settings_success_disable_instant_only() {
		wp_set_current_user( $this->admin_id );
		$new_settings = array(
			'instant_search_enabled' => true,
		);
		$expected     = array(
			'module_active'          => true,
			'instant_search_enabled' => true,
		);

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $new_settings ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $expected, $response->get_data() );
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
		$this->assertArrayHasKey( 'module_active', $response->get_data() );
		$this->assertArrayHasKey( 'instant_search_enabled', $response->get_data() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search` endpoint with editor user.
	 */
	public function test_get_search_results_unauthorized() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search` endpoint with editor user.
	 */
	public function test_get_search_results_success() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 6, $response->get_data()['total'] );
	}

}
