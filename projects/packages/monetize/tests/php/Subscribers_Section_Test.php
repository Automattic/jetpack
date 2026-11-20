<?php
/**
 * Tests for the Paid subscribers section.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Monetize\Sections\Subscribers
 */
#[CoversClass( Subscribers::class )]
class Subscribers_Section_Test extends BaseTestCase {

	/**
	 * The section's routes.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'subscribers'  => array( '/jetpack/v4/monetize/wpcom/v2/memberships/subscribers', 'GET' ),
			'cancellation' => array( '/jetpack/v4/monetize/wpcom/v2/memberships/subscriptions/(?P<id>\d+)/cancel', 'POST' ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 *
	 * @param string $route  The route.
	 * @param string $method Its method.
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_registers_the_route( $route, $method ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$register       = array( new Subscribers(), 'register_routes' );
		add_action( 'rest_api_init', $register );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', $register );

		$routes         = $wp_rest_server->get_routes();
		$wp_rest_server = null;

		$this->assertArrayHasKey( $route, $routes );
		$methods = array_merge( ...array_map( 'array_keys', array_column( $routes[ $route ], 'methods' ) ) );
		$this->assertContains( $method, $methods );
	}
}
