<?php
/**
 * Unit tests for Activity_Log_Bridge.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;
use function add_action;
use function add_filter;
use function do_action;
use function remove_filter;
use function wp_insert_user;
use function wp_set_current_user;

/**
 * Tests for the GET /jetpack/v4/site/rewindable-activity route.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\REST\Activity_Log_Bridge
 */
#[CoversClass( Activity_Log_Bridge::class )]
class Rest_Activity_Log_Bridge_Test extends TestCase {

	/**
	 * REST Server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Enable modernization, register routes, and prepare a fresh REST server.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		add_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		add_action( 'rest_api_init', array( Rest_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		remove_filter( Jetpack_Backup::MODERNIZATION_FILTER, '__return_true' );
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Route registers when the modernization filter is on.
	 */
	public function test_route_registers_when_modernized() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/site/rewindable-activity', $routes );
	}

	/**
	 * Route is gated on manage_options — a subscriber gets 403.
	 */
	public function test_route_requires_manage_options() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/site/rewindable-activity' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
}
