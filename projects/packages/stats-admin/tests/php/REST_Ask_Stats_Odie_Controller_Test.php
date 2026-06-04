<?php

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Ask_Stats_Odie_Controller class.
 *
 * @package automattic/jetpack-stats-admin
 */
class REST_Ask_Stats_Odie_Controller_Test extends Stats_TestCase {
	const ROUTE = '/jetpack/v4/stats-app/sites/999/ai/chat';

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * An instance of REST_Ask_Stats_Odie_Controller.
	 *
	 * @var REST_Ask_Stats_Odie_Controller
	 */
	protected $rest_ask_stats_odie_controller;

	/**
	 * Whether the current user is connected.
	 *
	 * @var bool
	 */
	protected $is_user_connected = true;

	/**
	 * HTTP status code returned by the Odie fixture.
	 *
	 * @var int
	 */
	protected $odie_response_code = 200;

	/**
	 * URL of the last intercepted Odie request.
	 *
	 * @var string|null
	 */
	protected $last_odie_url;

	/**
	 * JSON body of the last intercepted Odie request.
	 *
	 * @var array|null
	 */
	protected $last_odie_body;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		wp_set_current_user( 0 );

		$this->is_user_connected  = true;
		$this->odie_response_code = 200;
		$this->last_odie_url      = null;
		$this->last_odie_body     = null;

		add_filter( 'jetpack_stats_ask_stats_enabled', '__return_true' );
		add_filter( 'pre_http_request', array( $this, 'odie_http_response_fixture' ), 9, 3 );

		$this->set_plan( 'jetpack_premium' );

		$this->rest_ask_stats_odie_controller = new REST_Ask_Stats_Odie_Controller(
			$this->get_mocked_connection_manager()
		);

		add_action( 'rest_api_init', array( $this->rest_ask_stats_odie_controller, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_action( 'rest_api_init', array( $this->rest_ask_stats_odie_controller, 'register_rest_routes' ) );
		remove_filter( 'pre_http_request', array( $this, 'odie_http_response_fixture' ), 9 );
		remove_filter( 'jetpack_stats_ask_stats_enabled', '__return_true' );
		$this->reset_active_plan_cache();

		parent::tearDown();
	}

	/**
	 * Test a new Ask Stats chat request is forwarded to Odie with server-derived context.
	 */
	public function test_send_chat_message_succeeds() {
		wp_set_current_user( $this->admin_id );

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
				'context' => array(
					'blog_id' => 1,
					'evil'    => true,
				),
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 123, $response->get_data()['chat_id'] );
		$this->assertStringContainsString(
			'/wpcom/v2/odie/chat/wpcom-agent-ask_stats',
			$this->last_odie_url
		);
		$this->assertStringNotContainsString(
			'/wpcom/v2/odie/chat/wpcom-agent-ask_stats/',
			$this->last_odie_url
		);
		$this->assertEquals(
			array(
				'message' => 'How is my site doing today?',
				'context' => array(
					'blog_id' => 999,
				),
			),
			$this->last_odie_body
		);
	}

	/**
	 * Test Ask Stats is forbidden when the feature flag is off.
	 */
	public function test_send_chat_message_feature_disabled_forbidden() {
		remove_filter( 'jetpack_stats_ask_stats_enabled', '__return_true' );

		wp_set_current_user( $this->admin_id );

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
			)
		);

		$this->assertEquals( 403, $response->get_status() );
		$this->assertNull( $this->last_odie_url );
	}

	/**
	 * Test an existing Ask Stats chat request is forwarded to Odie.
	 */
	public function test_send_chat_message_continues_chat() {
		wp_set_current_user( $this->admin_id );

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'What about yesterday?',
				'chat_id' => 456,
			)
		);

		$this->assertEquals( 200, $response->get_status() );
		$this->assertStringContainsString(
			'/wpcom/v2/odie/chat/wpcom-agent-ask_stats/456',
			$this->last_odie_url
		);
	}

	/**
	 * Test users without Stats access are forbidden.
	 */
	public function test_send_chat_message_forbidden() {
		wp_set_current_user( $this->editor_id );

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
			)
		);

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test a connected user is required.
	 */
	public function test_send_chat_message_requires_user_connection() {
		wp_set_current_user( $this->admin_id );
		$this->is_user_connected = false;

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
			)
		);

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test free plans are not eligible by default.
	 */
	public function test_send_chat_message_free_plan_forbidden() {
		wp_set_current_user( $this->admin_id );
		$this->set_plan( 'jetpack_free' );

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
			)
		);

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test missing message returns bad request.
	 */
	public function test_send_chat_message_missing_message() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test remote Odie errors are returned.
	 */
	public function test_send_chat_message_remote_error() {
		wp_set_current_user( $this->admin_id );
		$this->odie_response_code = 500;

		$response = $this->dispatch_ask_stats_request(
			array(
				'message' => 'How is my site doing today?',
			)
		);

		$this->assertEquals( 500, $response->get_status() );
		$this->assertEquals( 'bot_run_failed', $response->get_data()['code'] );
	}

	/**
	 * Dispatch an Ask Stats request.
	 *
	 * @param array $body Request body params.
	 * @return \WP_REST_Response
	 */
	protected function dispatch_ask_stats_request( $body ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_body_params( $body );
		$request->set_header( 'content-type', 'application/json' );

		return $this->server->dispatch( $request );
	}

	/**
	 * Add http response fixtures for Odie calls.
	 *
	 * @param false|array $response    HTTP response.
	 * @param array       $parsed_args Request arguments.
	 * @param string      $url         URL.
	 * @return false|array
	 */
	public function odie_http_response_fixture( $response, array $parsed_args, $url ) {
		if ( false === strpos( $url, '/wpcom/v2/odie/chat/' ) ) {
			return $response;
		}

		$this->last_odie_url = $url;

		if ( isset( $parsed_args['body'] ) ) {
			$this->last_odie_body = json_decode( $parsed_args['body'], true );
		}

		$body = array(
			'chat_id' => 123,
			'message' => array(
				'content' => 'Your site had 42 views today.',
				'data'    => null,
			),
		);

		if ( 500 === $this->odie_response_code ) {
			$body = array(
				'code'    => 'bot_run_failed',
				'message' => 'Unable to run Ask Stats.',
			);
		}

		return array(
			'headers'  => array( 'content-type' => 'application/json' ),
			'response' => array(
				'code'    => $this->odie_response_code,
				'message' => 200 === $this->odie_response_code ? 'ok' : 'error',
			),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	/**
	 * Create a stubbed Connection_Manager instance.
	 *
	 * @return Connection_Manager
	 */
	private function get_mocked_connection_manager() {
		$connection_manager = $this->createStub( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturn( true );
		$connection_manager->method( 'is_user_connected' )->willReturnCallback(
			function () {
				return $this->is_user_connected;
			}
		);

		return $connection_manager;
	}

	/**
	 * Set the current plan slug.
	 *
	 * @param string $product_slug Product slug.
	 */
	private function set_plan( $product_slug ) {
		update_option(
			Current_Plan::PLAN_OPTION,
			array(
				'product_slug' => $product_slug,
				'features'     => array(
					'active' => array(),
				),
			),
			true
		);
		$this->reset_active_plan_cache();
	}

	/**
	 * Force the next `Current_Plan::get()` to re-read from the option store.
	 */
	private function reset_active_plan_cache() {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}
}
