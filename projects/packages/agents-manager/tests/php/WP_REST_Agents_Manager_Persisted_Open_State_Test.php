<?php
/**
 * WP_REST_Agents_Manager_Persisted_Open_State Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-wp-rest-agents-manager-persisted-open-state.php';

/**
 * Class WP_REST_Agents_Manager_Persisted_Open_State_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\WP_REST_Agents_Manager_Persisted_Open_State
 */
#[CoversClass( WP_REST_Agents_Manager_Persisted_Open_State::class )]
class WP_REST_Agents_Manager_Persisted_Open_State_Test extends \WorDBless\BaseTestCase {

	/**
	 * The controller instance.
	 *
	 * @var WP_REST_Agents_Manager_Persisted_Open_State
	 */
	private $controller;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new WP_REST_Agents_Manager_Persisted_Open_State();
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		// Reset the REST server to clear registered routes.
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Tests that the constructor sets the correct namespace.
	 */
	public function test_constructor_sets_correct_namespace() {
		$reflection = new \ReflectionClass( $this->controller );
		$property   = $reflection->getProperty( 'namespace' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		$this->assertEquals( 'agents-manager', $property->getValue( $this->controller ) );
	}

	/**
	 * Tests that the constructor sets the correct rest_base.
	 */
	public function test_constructor_sets_correct_rest_base() {
		$reflection = new \ReflectionClass( $this->controller );
		$property   = $reflection->getProperty( 'rest_base' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		$this->assertEquals( '/open-state', $property->getValue( $this->controller ) );
	}

	/**
	 * Tests that register_rest_route registers the expected routes.
	 */
	public function test_register_rest_route_registers_routes() {
		// Register the routes.
		$this->controller->register_rest_route();

		// Get registered routes.
		$routes = rest_get_server()->get_routes();

		// Check that the route is registered.
		$this->assertArrayHasKey( '/agents-manager/open-state', $routes );

		$route_data = $routes['/agents-manager/open-state'];

		// Check that both GET and POST methods are registered.
		$methods = array();
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['methods'] ) ) {
				$methods = array_merge( $methods, array_keys( $endpoint['methods'] ) );
			}
		}

		$this->assertContains( 'GET', $methods );
		$this->assertContains( 'POST', $methods );
	}

	/**
	 * Tests that the GET endpoint requires authentication.
	 */
	public function test_get_endpoint_requires_authentication() {
		// Register the routes.
		$this->controller->register_rest_route();

		// Get registered routes.
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/agents-manager/open-state'];

		// Find the GET endpoint.
		$get_endpoint = null;
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['methods']['GET'] ) && $endpoint['methods']['GET'] ) {
				$get_endpoint = $endpoint;
				break;
			}
		}

		$this->assertNotNull( $get_endpoint );
		$this->assertEquals( 'is_user_logged_in', $get_endpoint['permission_callback'] );
	}

	/**
	 * Tests that the POST endpoint requires authentication.
	 */
	public function test_post_endpoint_requires_authentication() {
		// Register the routes.
		$this->controller->register_rest_route();

		// Get registered routes.
		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/agents-manager/open-state'];

		// Find the POST endpoint.
		$post_endpoint = null;
		foreach ( $route_data as $endpoint ) {
			if ( isset( $endpoint['methods']['POST'] ) && $endpoint['methods']['POST'] ) {
				$post_endpoint = $endpoint;
				break;
			}
		}

		$this->assertNotNull( $post_endpoint );
		$this->assertEquals( 'is_user_logged_in', $post_endpoint['permission_callback'] );
	}

	/**
	 * Tests that the controller extends WP_REST_Controller.
	 */
	public function test_controller_extends_wp_rest_controller() {
		$this->assertInstanceOf( \WP_REST_Controller::class, $this->controller );
	}
}
