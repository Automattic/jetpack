<?php
/**
 * Tests for the route registration.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Endpoints
 */
#[CoversClass( Endpoints::class )]
class Endpoints_Test extends BaseTestCase {

	use REST_Requests;

	/**
	 * Register the routes on a fresh server.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_rest();
	}

	/**
	 * Drop the server.
	 */
	public function tear_down() {
		$this->tear_down_rest();

		parent::tear_down();
	}

	/**
	 * WordPress.com Simple serves `wpcom/v2` through public-api, but not `jetpack/v4` or a namespace of our own.
	 */
	public function test_every_route_is_under_wpcom_v2(): void {
		$routes = array_keys( rest_get_server()->get_routes() );

		foreach ( array( 'settings', 'status', 'services', 'services/custom' ) as $route ) {
			$this->assertContains( '/wpcom/v2/sharing-likes/' . $route, $routes );
		}
	}
}
