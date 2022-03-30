<?php
/**
 * Tests the endpoints within the Licensing package.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * Class Test_Licensing
 *
 * @package Automattic\Jetpack
 */
class Test_Licensing_Endpoints extends BaseTestCase {

	/**
	 * Used to store an instance of the WP_REST_Server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Ensure that Licensing package has been setup and hooks have been registered.
	 */
	public static function setUpBeforeClass() : void { // phpcs:ignore.
		parent::setUpBeforeClass();

		$licensing = new Licensing();
		$licensing->initialize();
		do_action( 'rest_api_init' );
	}

	/**
	 * Setup environment for REST API endpoints test.
	 */
	public function setUp(): void { // phpcs:ignore.
		parent::set_up_wordbless();

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean environment for REST API endpoints test.
	 */
	public function tearDown(): void { // phpcs:ignore.
		parent::tear_down_wordbless();

		global $wp_rest_server;
		$wp_rest_server = null;
	}

	/**
	 * Create and get a user using WP factory.
	 *
	 * @since 4.4.0
	 *
	 * @param string $role
	 *
	 * @return WP_User
	 */
	protected function create_and_get_user( $role = '' ) {
		$username = str_replace( '.', '', 'licensing_user_' . microtime( true ) );

		$user_id = wp_insert_user(
			array(
				'user_login' => $username,
				'user_pass'  => $username,
				'user_email' => $username . '@example.com',
			)
		);

		if ( is_wp_error( $user_id ) ) {
			$this->fail( 'Could not create user.' );
		}

		return new \WP_User( $user_id );
	}

	/**
	 * Creates a WP_REST_Request and returns it.
	 *
	 * @since 4.4.0
	 *
	 * @param string $route       REST API path to be append to /jetpack/v4/
	 * @param array  $json_params When present, parameters are added to request in JSON format
	 * @param string $method      Request method to use, GET or POST
	 * @param array  $params      Parameters to add to endpoint
	 *
	 * @return WP_REST_Response
	 */
	protected function create_and_get_request( $route = '', $json_params = array(), $method = 'GET', $params = array() ) {
		$request = new \WP_REST_Request( $method, "/jetpack/v4/$route" );

		if ( 'GET' !== $method && ! empty( $json_params ) ) {
			$request->set_header( 'content-type', 'application/json' );
		}
		if ( ! empty( $json_params ) ) {
			$request->set_body( json_encode( $json_params ) );
		}
		if ( ! empty( $params ) && is_array( $params ) ) {
			foreach ( $params as $key => $value ) {
				$request->set_param( $key, $value );
			}
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * Check response status code.
	 *
	 * @since 4.4.0
	 *
	 * @param integer          $status
	 * @param WP_REST_Response $response
	 */
	protected function assertResponseStatus( $status, $response ) {
		$this->assertEquals( $status, $response->get_status() );
	}

	/**
	 * Test saving and retrieving licensing errors.
	 *
	 * @since 9.0.0
	 */
	public function test_licensing_error() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_admin_page' );
		wp_set_current_user( $user->ID );

		// Should be empty by default.
		$request  = new \WP_REST_Request( 'GET', '/jetpack/v4/licensing/error' );
		$response = $this->server->dispatch( $request );
		$this->assertResponseStatus( 200, $response );
		$this->assertSame( '', $response->get_data() );

		// Should accept updates.
		$response = $this->create_and_get_request(
			'licensing/error',
			array(
				'error' => 'foo',
			),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
		$this->assertTrue( $response->get_data() );

		// Should return updated value.
		$request  = new \WP_REST_Request( 'GET', '/jetpack/v4/licensing/error' );
		$response = $this->server->dispatch( $request );
		$this->assertResponseStatus( 200, $response );
		$this->assertEquals( 'foo', $response->get_data() );
	}
}
