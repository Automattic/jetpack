<?php
/**
 * Bridge tests for the Scan REST controller — covers the admin-only
 * permission callback and route registration. Each `/jetpack/v4/site/scan/*`
 * route is a thin proxy to WPCOM, so the contract this test locks down is
 * the admin gate and the route surface (paths + methods); the WPCOM half of
 * each round-trip is exercised via integration tests, not here.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function has_action;
use function remove_action;
use function remove_all_actions;
use function remove_filter;
use function rest_get_server;
use function user_can;
use function wp_insert_user;
use function wp_set_current_user;

/**
 * Bridge tests for the Scan REST controller.
 *
 * @covers \Automattic\Jetpack\Scan_Page\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class Jetpack_Scan_Bridges_Test extends TestCase {

	/**
	 * REST Server instance shared across the cases.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Admin user id, created in setUp.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id, created in setUp.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Boot a fresh REST_Server, register the Scan routes, seed an admin
	 * + a subscriber. Each test starts with no current user (anonymous).
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'scan_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'scan_subscriber',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( 0 );

		add_action( 'rest_api_init', array( REST_Controller::class, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Reset shared state between tests so a stuck $_GET / current-user from
	 * one case can't leak into the next.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Every Scan route should be registered under `jetpack/v4` after the
	 * `rest_api_init` action fires.
	 */
	public function test_routes_are_registered() {
		$routes = $this->server->get_routes( 'jetpack/v4' );

		$this->assertArrayHasKey( '/jetpack/v4/site/scan', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/history', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/counts', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/enqueue', $routes );
		$this->assertArrayHasKey(
			'/jetpack/v4/site/scan/threat/(?P<id>[\w\-]+)/ignore',
			$routes
		);
		$this->assertArrayHasKey(
			'/jetpack/v4/site/scan/threat/(?P<id>[\w\-]+)/unignore',
			$routes
		);
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/threats/fix', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/threats/fix-status', $routes );
	}

	/**
	 * Routes register even when the modernization filter is off.
	 *
	 * Protect calls /jetpack/v4/site/scan/* via the same bridges; ungating
	 * REST registration is what lets that work without flipping the
	 * admin-UI filter on.
	 */
	public function test_routes_register_when_filter_is_off() {
		add_filter( 'rsm_jetpack_ui_modernization_scan', '__return_false' );

		// Re-trigger initialization for the assertion. The first
		// bootstrap may have already fired with the test default.
		remove_all_actions( 'rest_api_init' );
		Jetpack_Scan::register_rest_routes();

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/site/scan', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/site/scan/history', $routes );

		remove_filter( 'rsm_jetpack_ui_modernization_scan', '__return_false' );
	}

	/**
	 * The `rest_api_init` hook is wired by `Jetpack_Scan::initialize()`
	 * regardless of the modernization filter.
	 *
	 * The neighbour `test_routes_register_when_filter_is_off` only proves
	 * the registration callback works when invoked directly. This case
	 * proves the hook subscription itself isn't gated by the filter — a
	 * regression that moved the `add_action( 'rest_api_init', ... )`
	 * line inside the modernization-only branch would silently break
	 * Protect's bridge consumption while still passing the direct-call
	 * test above.
	 *
	 * Note: `initialize()` registers its own static method
	 * `Jetpack_Scan::register_rest_routes` (which delegates to
	 * `REST_Controller::register_rest_routes`), so we assert against
	 * that callable, not the underlying controller method.
	 */
	public function test_routes_register_via_rest_api_init_when_filter_is_off() {
		add_filter( Jetpack_Scan::MODERNIZATION_FILTER, '__return_false' );

		$callback = array( Jetpack_Scan::class, 'register_rest_routes' );

		// `setUp` registers `REST_Controller::register_rest_routes` inline (not
		// via `Jetpack_Scan::initialize()`), so the callable we care about
		// here — `Jetpack_Scan::register_rest_routes` — should not be wired
		// yet on a fresh harness.
		$this->assertFalse(
			has_action( 'rest_api_init', $callback ),
			'Pre-condition: Jetpack_Scan::register_rest_routes should not be wired before initialize() runs.'
		);

		Jetpack_Scan::initialize();

		$this->assertNotFalse(
			has_action( 'rest_api_init', $callback ),
			'Jetpack_Scan::initialize() must wire `rest_api_init` regardless of the modernization filter so Protect can call /jetpack/v4/site/scan/*.'
		);

		// Leave the harness as we found it: drop the action this test
		// added, so subsequent `do_action( 'rest_api_init' )` calls don't
		// double-register.
		remove_action( 'rest_api_init', $callback );
		remove_filter( Jetpack_Scan::MODERNIZATION_FILTER, '__return_false' );
	}

	/**
	 * Anonymous requests against any Scan route hit the permission callback
	 * and should be rejected with a 401, never reaching the WPCOM proxy.
	 */
	public function test_anonymous_request_is_rejected() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/scan' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Authenticated non-admin (subscriber) shouldn't sneak past the gate
	 * even though they are signed in.
	 */
	public function test_subscriber_request_is_rejected() {
		wp_set_current_user( $this->subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/scan/history' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Admin gets past the permission callback. The downstream WPCOM
	 * proxy will fail (no blog id is set in the test environment), but
	 * that's the next layer — we only need to confirm the gate is
	 * permissive for admins.
	 *
	 * @param string $method HTTP method.
	 * @param string $path   Local REST path.
	 * @dataProvider provide_admin_routes
	 */
	#[DataProvider( 'provide_admin_routes' )]
	public function test_admin_request_passes_permission_check( $method, $path ) {
		wp_set_current_user( $this->admin_id );

		$request  = new WP_REST_Request( $method, $path );
		$response = $this->server->dispatch( $request );

		// Anything other than 401 means the permission callback let us through.
		// The handler may still 400 (no blog id) or 500 (WPCOM proxy error)
		// — those are valid downstream outcomes. Failing on 401 catches a
		// regression in the gate without coupling the test to WPCOM I/O.
		$this->assertNotSame(
			401,
			$response->get_status(),
			"Admin should pass the permission callback for $method $path"
		);
	}

	/**
	 * Mutation routes 403 when the current admin has no user connection.
	 *
	 * Without this gate, Client::wpcom_json_api_request_as_user falls back
	 * to blog auth and writes are silently mis-attributed.
	 *
	 * The two pre-dispatch assertions pin which gate fires: the admin
	 * cap gate must pass (so we know the 403 is the user-connection
	 * gate, not `permissions_check`), and the user-connection predicate
	 * must be false (so we know the gate has something to reject on).
	 */
	public function test_mutation_routes_require_user_connection() {
		// Admin user, but no Jetpack user connection.
		wp_set_current_user( $this->admin_id );

		// Pre-dispatch invariant 1: admin cap gate would pass.
		$this->assertTrue(
			user_can( $this->admin_id, 'manage_options' ),
			'Admin user must have manage_options capability so we know it is the user-connection gate (not the cap gate) firing the 403.'
		);

		// Pre-dispatch invariant 2: the user-connection gate predicate is false.
		$connection = new \Automattic\Jetpack\Connection\Manager();
		$this->assertFalse(
			$connection->is_user_connected( $this->admin_id ),
			'Test environment must report no user connection so the gate has something to reject.'
		);

		$request  = new WP_REST_Request( 'POST', '/jetpack/v4/site/scan/threat/123/ignore' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_no_user_connection', $response->get_data()['code'] );
	}

	/**
	 * Routes the admin-passes-permission check exercises.
	 *
	 * @return array<string, array{string, string}>
	 */
	public static function provide_admin_routes() {
		return array(
			'GET /scan'                 => array( 'GET', '/jetpack/v4/site/scan' ),
			'GET /scan/history'         => array( 'GET', '/jetpack/v4/site/scan/history' ),
			'GET /scan/counts'          => array( 'GET', '/jetpack/v4/site/scan/counts' ),
			'POST /scan/enqueue'        => array( 'POST', '/jetpack/v4/site/scan/enqueue' ),
			'POST /threat/abc/ignore'   => array( 'POST', '/jetpack/v4/site/scan/threat/abc/ignore' ),
			'POST /threat/abc/unignore' => array( 'POST', '/jetpack/v4/site/scan/threat/abc/unignore' ),
		);
	}
}
