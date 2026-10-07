<?php
/**
 * Tests for the route registration.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/trait-section-environment.php';
require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Endpoints
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Controller
 */
#[CoversClass( Endpoints::class )]
#[CoversClass( Controller::class )]
class Endpoints_Test extends BaseTestCase {

	use Section_Environment;
	use REST_Requests;

	/**
	 * Register the routes on a fresh server, for a connected site.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->set_up_rest();
		$this->given_connection( true );
	}

	/**
	 * Drop the server.
	 */
	public function tear_down() {
		$this->tear_down_rest();
		$this->tear_down_site();

		parent::tear_down();
	}

	/**
	 * See `Endpoints` for why the namespace is `wpcom/v2`.
	 */
	public function test_every_route_is_under_wpcom_v2(): void {
		$routes = array_keys( rest_get_server()->get_routes() );

		foreach ( array( 'settings', 'status', 'services', 'services/custom' ) as $route ) {
			$this->assertContains( '/wpcom/v2/sharing-likes/' . $route, $routes );
		}
	}

	/**
	 * Every route and method, with a body that clears its required arguments.
	 *
	 * @return array<string, array{0: string, 1: string, 2?: array<string,mixed>}>
	 */
	public static function provide_routes(): array {
		return array(
			'read settings'         => array( 'GET', 'settings' ),
			'save settings'         => array( 'POST', 'settings' ),
			'read status'           => array( 'GET', 'status' ),
			'switch to the block'   => array( 'POST', 'sharing/switch-to-block' ),
			'turn on'               => array( 'POST', 'likes/activate' ),
			'list services'         => array( 'GET', 'services' ),
			'save services'         => array(
				'POST',
				'services',
				array(
					'visible' => array(),
					'hidden'  => array(),
				),
			),
			'create custom service' => array(
				'POST',
				'services/custom',
				array(
					'name' => 'Custom',
					'url'  => 'https://example.com/share',
					'icon' => 'https://example.com/icon.png',
				),
			),
			'edit custom service'   => array( 'POST', 'services/custom/custom-1000' ),
			'delete custom service' => array( 'DELETE', 'services/custom/custom-1000' ),
		);
	}

	/**
	 * @param string $method HTTP method.
	 * @param string $route  Route under `wpcom/v2/sharing-likes/`.
	 * @param array  $body   Request body.
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_every_route_requires_manage_options( string $method, string $route, array $body = array() ): void {
		$this->log_in_as( 'editor' );

		$this->assertSame( 403, $this->request( $method, $route, $body )->get_status() );
	}

	/**
	 * @param string $method HTTP method.
	 * @param string $route  Route under `wpcom/v2/sharing-likes/`.
	 * @param array  $body   Request body.
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_every_route_is_unavailable_where_the_screen_is( string $method, string $route, array $body = array() ): void {
		$this->given_connection( false );
		$this->log_in_as( 'administrator' );

		$response = $this->request( $method, $route, $body );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'rest_sharing_likes_unavailable', $response->get_data()['code'] );
	}
}
