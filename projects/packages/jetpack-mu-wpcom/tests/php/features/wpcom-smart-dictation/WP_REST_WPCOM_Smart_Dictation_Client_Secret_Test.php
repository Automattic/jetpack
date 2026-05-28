<?php
/**
 * WP_REST_WPCOM_Smart_Dictation_Client_Secret Tests File
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\WPCOM_DICTATION;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-smart-dictation/class-wp-rest-wpcom-smart-dictation-client-secret.php';

/**
 * Class WP_REST_WPCOM_Smart_Dictation_Client_Secret_Test
 *
 * @covers \A8C\WPCOM_DICTATION\WP_REST_WPCOM_Smart_Dictation_Client_Secret
 */
#[CoversClass( WP_REST_WPCOM_Smart_Dictation_Client_Secret::class )]
class WP_REST_WPCOM_Smart_Dictation_Client_Secret_Test extends \WorDBless\BaseTestCase {

	/**
	 * The controller instance.
	 *
	 * @var WP_REST_WPCOM_Smart_Dictation_Client_Secret
	 */
	private $controller;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new WP_REST_WPCOM_Smart_Dictation_Client_Secret();
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
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

		$this->assertEquals( 'wpcom/v2', $property->getValue( $this->controller ) );
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

		$this->assertEquals( '/dictation-client-secret', $property->getValue( $this->controller ) );
	}

	/**
	 * Tests that register_rest_route registers the expected route.
	 */
	public function test_register_rest_route_registers_route() {
		$this->controller->register_rest_route();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/dictation-client-secret', $routes );
	}

	/**
	 * Tests that the POST endpoint requires authentication.
	 */
	public function test_post_endpoint_requires_authentication() {
		$this->controller->register_rest_route();

		$routes     = rest_get_server()->get_routes();
		$route_data = $routes['/wpcom/v2/dictation-client-secret'];

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
	 * Tests that the endpoint validates session instructions.
	 */
	public function test_get_client_secret_requires_session_instructions() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/dictation-client-secret' );
		$request->set_param( 'session', array() );

		$response = $this->controller->get_client_secret( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'invalid_session', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	/**
	 * Tests that the endpoint validates object session instructions.
	 */
	public function test_get_client_secret_requires_object_session_instructions() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/dictation-client-secret' );
		$request->set_param( 'session', (object) array() );

		$response = $this->controller->get_client_secret( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'invalid_session', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}

	/**
	 * Tests that the controller extends WP_REST_Controller.
	 */
	public function test_controller_extends_wp_rest_controller() {
		$this->assertInstanceOf( \WP_REST_Controller::class, $this->controller );
	}
}
