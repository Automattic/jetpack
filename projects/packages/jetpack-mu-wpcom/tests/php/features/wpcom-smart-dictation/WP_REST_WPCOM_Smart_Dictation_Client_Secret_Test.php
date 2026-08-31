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
	 * Tests that register_rest_route registers the expected routes.
	 */
	public function test_register_rest_route_registers_routes() {
		$this->controller->register_rest_route();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/dictation-client-secret', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/dictation-client-secret/settle', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/dictation-client-secret/remaining-time', $routes );
	}

	/**
	 * Tests that the endpoints require authentication.
	 */
	public function test_endpoints_require_authentication() {
		$this->controller->register_rest_route();

		$routes             = rest_get_server()->get_routes();
		$expected_endpoints = array(
			'/wpcom/v2/dictation-client-secret'        => 'POST',
			'/wpcom/v2/dictation-client-secret/settle' => 'POST',
			'/wpcom/v2/dictation-client-secret/remaining-time' => 'GET',
		);

		foreach ( $expected_endpoints as $route => $method ) {
			$route_endpoint = null;
			foreach ( $routes[ $route ] as $endpoint ) {
				if ( isset( $endpoint['methods'][ $method ] ) && $endpoint['methods'][ $method ] ) {
					$route_endpoint = $endpoint;
					break;
				}
			}

			$this->assertNotNull( $route_endpoint );
			$this->assertEquals( 'is_user_logged_in', $route_endpoint['permission_callback'] );
		}
	}

	/**
	 * Tests that the endpoint allows optional session instructions.
	 */
	public function test_validate_session_allows_optional_instructions() {
		$this->assertTrue( $this->controller->validate_session( null ) );
		$this->assertTrue( $this->controller->validate_session( array() ) );
		$this->assertTrue( $this->controller->validate_session( array( 'instructions' => 'Write clearly.' ) ) );
	}

	/**
	 * Tests that the endpoint rejects unsupported session fields.
	 */
	public function test_create_client_secret_rejects_unsupported_session_fields() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/dictation-client-secret' );
		$request->set_param(
			'session',
			array(
				'instructions' => 'Write clearly.',
				'voice'        => 'alloy',
			)
		);

		$response = $this->controller->create_client_secret( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_invalid_param', $response->get_error_code() );
	}

	/**
	 * Tests that the endpoint rejects invalid session instructions.
	 */
	public function test_create_client_secret_rejects_non_string_session_instructions() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/dictation-client-secret' );
		$request->set_param( 'session', array( 'instructions' => array() ) );

		$response = $this->controller->create_client_secret( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_invalid_param', $response->get_error_code() );
	}

	/**
	 * Tests that the controller extends WP_REST_Controller.
	 */
	public function test_controller_extends_wp_rest_controller() {
		$this->assertInstanceOf( \WP_REST_Controller::class, $this->controller );
	}
}
