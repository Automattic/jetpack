<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
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
		$plan->method( 'supports_instant_search' )->willReturn( true );

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
	 * Testing the `POST /jetpack/v4/search/plan` endpoint with an editor user.
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
	 * Testing the `POST /jetpack/v4/search/plan` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an editor user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `GET /jetpack/v4/search/settings` endpoint with an editor user.
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
	 * Testing the `POST /jetpack/v4/search/settings` endpoint with an admin user.
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
	 * Testing the `GET /jetpack/v4/search` endpoint with no logged-in user.
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
	public function test_get_search_results_success_editor() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 6, $response->get_data()['total'] );
	}

	/**
	 * Testing the `GET /jetpack/v4/search` endpoint with admin user.
	 */
	public function test_get_search_results_success_admin() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 6, $response->get_data()['total'] );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan/activate` endpoint with no user.
	 */
	public function test_activate_plan_authorized() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/plan/activate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"search_plan_info":' . Search_Test_Case::PLAN_INFO_FIXTURE . '}' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan/activate` endpoint with editor user.
	 */
	public function test_activate_plan_editor() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/plan/activate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"search_plan_info":' . Search_Test_Case::PLAN_INFO_FIXTURE . '}' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan/activate` endpoint with admin user.
	 */
	public function test_activate_plan_admin() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/plan/activate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( '{"search_plan_info":' . Search_Test_Case::PLAN_INFO_FIXTURE . '}' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan/deactivate` endpoint with no user.
	 */
	public function test_deactivate_plan_authorized() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/plan/deactivate' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the `POST /jetpack/v4/search/plan/deactivate` endpoint with editor user.
	 */
	public function test_deactivate_plan_editor() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/search/plan/deactivate' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search/post-type-breakdown` endpoint with blog_token.
	 */
	public function test_get_post_type_breakdown() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/post-type-breakdown' );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->dispatch_request_signed_with_blog_token( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search/post-type-breakdown` with editor user.
	 */
	public function test_get_post_type_breakdown_regular_user() {
		wp_set_current_user( $this->editor_id );
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/post-type-breakdown' );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Testing the `GET /jetpack/v4/search/post-type-breakdown` with no auth.
	 */
	public function test_get_post_type_breakdown_no_auth() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/search/post-type-breakdown' );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Signs a request with a blog token before dispatching it.
	 *
	 * Ensures that these tests pass through Connection_Rest_Authentication::wp_rest_authenticate,
	 * because WP_REST_Server::dispatch doesn't call any auth logic (in a real
	 * request, this would all happen earlier).
	 *
	 * @param WP_REST_Request $request The request to sign before dispatching.
	 * @return WP_REST_Response
	 */
	private function dispatch_request_signed_with_blog_token( $request ) {
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		$token     = 'new:1:0';
		$timestamp = (string) time();
		$nonce     = 'testing123';
		$body_hash = '';

		$_SERVER['REQUEST_METHOD'] = 'POST';

		$_GET['_for']      = 'jetpack';
		$_GET['token']     = $token;
		$_GET['timestamp'] = $timestamp;
		$_GET['nonce']     = $nonce;
		$_GET['body-hash'] = $body_hash;
		// This is intentionally using base64_encode().
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$token,
						$timestamp,
						$nonce,
						$body_hash,
						'POST',
						'anything.example',
						'80',
						'',
					)
				) . "\n",
				'blogtoken',
				true
			)
		);

		$jp_connection_auth = Connection_Rest_Authentication::init();
		$jp_connection_auth->wp_rest_authenticate( false );

		$response = $this->server->dispatch( $request );

		$jp_connection_auth->reset_saved_auth_state();

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		return $response;
	}

}
