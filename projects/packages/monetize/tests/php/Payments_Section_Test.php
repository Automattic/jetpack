<?php
/**
 * Tests for the Payments section.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Monetize\Sections\Payments
 */
#[CoversClass( Payments::class )]
class Payments_Section_Test extends BaseTestCase {

	public function test_registers_the_memberships_status_route() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$register       = array( new Payments(), 'register_routes' );
		add_action( 'rest_api_init', $register );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', $register );

		$routes         = $wp_rest_server->get_routes();
		$wp_rest_server = null;

		$this->assertArrayHasKey( '/jetpack/v4/monetize/wpcom/v2/memberships/status', $routes );
		$this->assertArrayHasKey( 'GET', $routes['/jetpack/v4/monetize/wpcom/v2/memberships/status'][0]['methods'] );
	}
}
