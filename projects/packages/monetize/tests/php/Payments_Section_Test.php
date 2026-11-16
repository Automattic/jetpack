<?php
/**
 * Tests for the Payments section.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Monetize\Sections\Payments
 */
#[CoversClass( Payments::class )]
class Payments_Section_Test extends BaseTestCase {

	/**
	 * The section's routes.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'Stripe status'     => array( '/jetpack/v4/monetize/wpcom/v2/memberships/status', 'GET' ),
			'Stripe disconnect' => array( '/jetpack/v4/monetize/wpcom/v2/memberships/stripe/disconnect', 'POST' ),
			'earnings'          => array( '/jetpack/v4/monetize/wpcom/v2/memberships/earnings', 'GET' ),
			'plans'             => array( '/jetpack/v4/monetize/wpcom/v2/memberships/products', 'GET' ),
			'plan deletion'     => array( '/jetpack/v4/monetize/wpcom/v2/memberships/product/(?P<id>\\d+)', 'DELETE' ),
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
		$register       = array( new Payments(), 'register_routes' );
		add_action( 'rest_api_init', $register );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', $register );

		$routes         = $wp_rest_server->get_routes();
		$wp_rest_server = null;

		$this->assertArrayHasKey( $route, $routes );
		$this->assertArrayHasKey( $method, $routes[ $route ][0]['methods'] );
	}
}
