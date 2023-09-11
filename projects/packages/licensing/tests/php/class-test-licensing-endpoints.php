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
	 * Used to store a boolean for whether we've initialized licensing before running tests.
	 *
	 * @var boolean
	 */
	private $has_done_setup;

	/**
	 * Ensure that Licensing package has been setup and hooks have been registered.
	 *
	 * We could be using setupBeforeClass() here, but that has a conflict with our PHP 5.6 lint. So, using this workaround
	 * and crying inside a bit. See: https://github.com/Automattic/jetpack/pull/23687#discussion_r838790636.
	 *
	 * @since 1.7.0
	 */
	public function maybe_do_setup() {
		if ( ! $this->has_done_setup ) {
			$licensing = new Licensing();
			$licensing->initialize(); // Ensure that licensing hooks are initialized so that we can register endpoints.

			global $wp_rest_server;
			$wp_rest_server = new \WP_REST_Server();
			$this->server   = $wp_rest_server;

			$this->has_done_setup = true;
			do_action( 'rest_api_init' ); // Now, register endpoints.
		}
	}

	/**
	 * Create and get a user using WP factory.
	 *
	 * @since-jetpack 4.4.0
	 *
	 * @since 1.7.0
	 *
	 * @param string $role The role to assign the created user.
	 *
	 * @return WP_User
	 */
	protected function create_and_get_user( $role = 'subscriber' ) {
		$username = str_replace( '.', '', 'licensing_user_' . microtime( true ) );

		$user_id = wp_insert_user(
			array(
				'user_login' => $username,
				'user_pass'  => $username,
				'user_email' => $username . '@example.com',
				'role'       => $role,
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
	 * @since-jetpack 4.4.0
	 *
	 * @since 1.7.0
	 *
	 * @param string $route       REST API path to be append to /jetpack/v4/.
	 * @param array  $json_params When present, parameters are added to request in JSON format.
	 * @param string $method      Request method to use, GET or POST.
	 * @param array  $params      Parameters to add to endpoint.
	 *
	 * @return WP_REST_Response
	 */
	protected function create_and_get_request( $route = '', $json_params = array(), $method = 'GET', $params = array() ) {
		$request = new \WP_REST_Request( $method, "/jetpack/v4/$route" );

		if ( 'GET' !== $method && ! empty( $json_params ) ) {
			$request->set_header( 'content-type', 'application/json' );
		}
		if ( ! empty( $json_params ) ) {
			$request->set_body( wp_json_encode( $json_params ) );
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
	 * @since-jetpack 4.4.0
	 *
	 * @since 1.7.0
	 *
	 * @param integer          $status   The expected status.
	 * @param WP_REST_Response $response The response object.
	 */
	protected function assertResponseStatus( $status, $response ) {
		$this->assertEquals( $status, $response->get_status() );
	}

	/**
	 * Test saving and retrieving licensing errors.
	 *
	 * @since-jetpack 9.0.0
	 *
	 * @since 1.7.0
	 */
	public function test_licensing_error() {
		$this->maybe_do_setup();

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
