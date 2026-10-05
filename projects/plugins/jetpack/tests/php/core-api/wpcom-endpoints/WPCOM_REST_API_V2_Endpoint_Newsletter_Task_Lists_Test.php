<?php
/**
 * Tests for the /wpcom/v2/newsletter/task-lists proxy endpoints.
 *
 * @covers WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists::class )]
class WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID, connected to WP.com.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * Mock author user ID.
	 *
	 * @var int
	 */
	private static $author_id = 0;

	/**
	 * Mock WP.com blog ID.
	 *
	 * @var int
	 */
	private static $blog_id = 123;

	/**
	 * The list route pattern.
	 *
	 * @var string
	 */
	private const LIST_ROUTE = '/wpcom/v2/newsletter/task-lists/(?P<list_id>[a-z_-]+)';

	/**
	 * The task completion route pattern.
	 *
	 * @var string
	 */
	private const COMPLETE_ROUTE = '/wpcom/v2/newsletter/task-lists/(?P<list_id>[a-z_-]+)/tasks/(?P<task_id>[a-z_]+)/complete';

	/**
	 * Method and URL of the last request proxied to WP.com.
	 *
	 * @var array|null
	 */
	private $proxied = null;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * Set up the environment for a test.
	 */
	public function set_up() {
		wp_set_current_user( static::$admin_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		// Manually load the class under test — `wpcom_rest_api_v2_load_plugin()` only runs on
		// `plugins_loaded`, which has already passed by the time the test harness boots.
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists();

		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Both routes are registered on Jetpack-connected sites, where WP.com's own implementation is
	 * out of reach.
	 */
	public function test_routes_are_registered() {
		$routes = $this->server->get_routes( 'wpcom/v2' );

		$this->assertArrayHasKey( self::LIST_ROUTE, $routes );
		$this->assertArrayHasKey( self::COMPLETE_ROUTE, $routes );
	}

	/**
	 * On WP.com Simple, WP.com registers these exact routes itself — registering a proxy there would
	 * shadow the real implementation, so the class stands down.
	 */
	public function test_routes_are_not_registered_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$GLOBALS['wp_rest_server'] = new JPTest_Spy_REST_Server();
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Newsletter_Task_Lists();
		do_action( 'rest_api_init' );
		$this->server = $GLOBALS['wp_rest_server'];

		$routes = $this->server->get_routes( 'wpcom/v2' );
		$this->assertArrayNotHasKey( self::LIST_ROUTE, $routes );
		$this->assertArrayNotHasKey( self::COMPLETE_ROUTE, $routes );
	}

	/**
	 * Anonymous requests are rejected before any proxying happens.
	 */
	public function test_rejects_anonymous() {
		wp_set_current_user( 0 );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ), 10, 3 );

		$this->assertSame( 401, $this->get_list()->get_status() );
		$this->assertSame( 401, $this->complete( 'subscribers' )->get_status() );
		$this->assertNull( $this->proxied );
	}

	/**
	 * The checklist is site management, so authors can't read or complete it either.
	 */
	public function test_rejects_non_admin() {
		wp_set_current_user( static::$author_id );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ), 10, 3 );

		$this->assertSame( 403, $this->get_list()->get_status() );
		$this->assertSame( 403, $this->complete( 'subscribers' )->get_status() );
		$this->assertNull( $this->proxied );
	}

	/**
	 * An administrator who hasn't connected their WP.com account can't be proxied as a user.
	 */
	public function test_rejects_non_connected_admin() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$response = $this->get_list();

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
		$this->assertSame( 'Please connect your user account to WordPress.com', $response->get_data()['message'] );
	}

	/**
	 * Reading a list forwards the list id as a path segment.
	 */
	public function test_get_list_is_proxied_to_wpcom() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ), 10, 3 );

		$response = $this->get_list();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'onboarding', $response->get_data()['id'] );
		$this->assertSame( Requests::GET, $this->proxied['method'] );
		$this->assertSame(
			'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/newsletter/task-lists/onboarding',
			$this->proxied['url']
		);
	}

	/**
	 * Completing a task forwards the list and task ids, and the `complete` action, as path segments.
	 */
	public function test_complete_task_is_proxied_to_wpcom() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ), 10, 3 );

		$response = $this->complete( 'send_newsletter' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Requests::POST, $this->proxied['method'] );
		$this->assertSame(
			'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/newsletter/task-lists/onboarding/tasks/send_newsletter/complete',
			$this->proxied['url']
		);
	}

	/**
	 * Ids are path segments, so anything outside their shape doesn't match a route and is never proxied.
	 */
	public function test_malformed_ids_do_not_match_a_route() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ), 10, 3 );

		foreach ( array(
			array( Requests::GET, '/wpcom/v2/newsletter/task-lists/Onboarding' ),
			array( Requests::GET, '/wpcom/v2/newsletter/task-lists/on%2Fboarding' ),
			array( Requests::POST, '/wpcom/v2/newsletter/task-lists/onboarding/tasks/send-newsletter/complete' ),
			array( Requests::POST, '/wpcom/v2/newsletter/task-lists/onboarding/tasks/subscribers' ),
		) as list( $method, $path ) ) {
			$response = $this->server->dispatch( new WP_REST_Request( $method, $path ) );
			$this->assertSame( 404, $response->get_status(), $path );
		}
		$this->assertNull( $this->proxied );
	}

	/**
	 * A WP.com error, e.g. an unknown task, is passed back to the caller.
	 */
	public function test_wpcom_error_is_passed_through() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_error' ), 10, 3 );

		$response = $this->complete( 'start' );

		$this->assertErrorResponse( 'task_not_manual', $response, 400 );
	}

	/**
	 * Dispatch a read of the onboarding list.
	 *
	 * @return WP_REST_Response
	 */
	private function get_list() {
		return $this->server->dispatch( new WP_REST_Request( Requests::GET, '/wpcom/v2/newsletter/task-lists/onboarding' ) );
	}

	/**
	 * Dispatch a completion of an onboarding task.
	 *
	 * @param string $task_id Task id.
	 * @return WP_REST_Response
	 */
	private function complete( $task_id ) {
		return $this->server->dispatch(
			new WP_REST_Request( Requests::POST, '/wpcom/v2/newsletter/task-lists/onboarding/tasks/' . $task_id . '/complete' )
		);
	}

	/**
	 * Mock Jetpack private options, connecting the admin user.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$admin_id => 'pretend_this_is_valid.secret.' . static::$admin_id,
			),
		);
	}

	/**
	 * Mock Jetpack options.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array(
			'id' => static::$blog_id,
		);
	}

	/**
	 * Record the proxied request and answer it with a task list.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_response( $response, $args, $url ) {
		$this->proxied = array(
			'method' => $args['method'],
			'url'    => strtok( $url, '?' ),
		);

		return array(
			'headers'  => array(),
			'body'     => '{"id":"onboarding","tasks":[{"id":"start","complete":true},{"id":"subscribe_form","complete":false},{"id":"subscribers","complete":false},{"id":"send_newsletter","complete":true}]}',
			'response' => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Answer the proxied request with a WP.com error.
	 *
	 * @return array
	 */
	public function mock_wpcom_error() {
		return array(
			'headers'  => array(),
			'body'     => '{"code":"task_not_manual","message":"This task cannot be completed by hand.","data":{"status":400}}',
			'response' => array(
				'code' => 400,
			),
		);
	}
}
