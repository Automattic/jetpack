<?php
/**
 * Tests for the Ads section.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Monetize\Sections\Ads
 */
#[CoversClass( Ads::class )]
class Ads_Section_Test extends BaseTestCase {

	/**
	 * The earnings and approval routes; Ads_Wpcom_Settings_Test covers the payout and sync ones.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'earnings' => array( '/jetpack/v4/monetize/wpcom/v2/wordads/earnings', 'GET' ),
			'payouts'  => array( '/jetpack/v4/monetize/wpcom/v2/wordads/payments', 'GET' ),
			'approval' => array( '/jetpack/v4/monetize/rest/v1.1/wordads/account', 'GET' ),
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
		$register       = array( new Ads(), 'register_routes' );
		add_action( 'rest_api_init', $register );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', $register );

		$routes         = $wp_rest_server->get_routes();
		$wp_rest_server = null;

		$this->assertArrayHasKey( $route, $routes );
		$this->assertArrayHasKey( $method, $routes[ $route ][0]['methods'] );
	}
}
