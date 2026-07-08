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
use function do_action;
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
