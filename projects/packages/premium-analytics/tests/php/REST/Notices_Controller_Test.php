<?php
/**
 * Tests for Notices_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Notices_Controller
 */
#[CoversClass( Notices_Controller::class )]
class Notices_Controller_Test extends BaseTestCase {

	const ROUTE = '/jetpack-premium-analytics/v1/notices';

	/**
	 * Controller under test.
	 *
	 * @var Notices_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Notices_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function test_registers_notices_route_with_read_and_write_methods() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::ROUTE, $routes );

		$methods = array();
		foreach ( $routes[ self::ROUTE ] as $handler ) {
			$methods += $handler['methods'];
		}
		$this->assertArrayHasKey( 'GET', $methods );
		$this->assertArrayHasKey( 'POST', $methods );
	}

	public function test_route_uses_expected_callbacks() {
		$handlers = rest_get_server()->get_routes()[ self::ROUTE ];

		$by_method = array();
		foreach ( $handlers as $handler ) {
			foreach ( $handler['methods'] as $method => $enabled ) {
				$by_method[ $method ] = $handler;
			}
		}

		$this->assertSame( array( $this->controller, 'get_notices' ), $by_method['GET']['callback'] );
		$this->assertSame( array( $this->controller, 'update_notice' ), $by_method['POST']['callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $by_method['GET']['permission_callback'] );
		$this->assertSame( array( $this->controller, 'check_permission' ), $by_method['POST']['permission_callback'] );
	}

	public function test_write_route_declares_notice_args() {
		$args = array();
		foreach ( rest_get_server()->get_routes()[ self::ROUTE ] as $handler ) {
			if ( isset( $handler['methods']['POST'] ) && isset( $handler['args'] ) ) {
				$args = (array) $handler['args'];
			}
		}

		$this->assertArrayHasKey( 'id', $args );
		$this->assertArrayHasKey( 'status', $args );
		$this->assertArrayHasKey( 'postponed_for', $args );
		$this->assertNotEmpty( $args['id']['required'] );
		$this->assertNotEmpty( $args['status']['required'] );
	}

	public function test_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_notices_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_notices_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_permission_denied_for_anonymous_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_permission() );
	}
}
