<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * REST Authentication functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * REST Authentication functionality testing.
 */
class REST_Authentication_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp() {
		parent::setUp();

		$this->rest_authentication = Rest_Authentication::init();

		$this->manager = $this->getMockBuilder( 'Manager' )
			->setMethods( array( 'verify_xml_rpc_signature', 'reset_saved_auth_state' ) )
			->getMock();

		$reflection_class = new \ReflectionClass( get_class( $this->rest_authentication ) );
		$manager_property = $reflection_class->getProperty( 'connection_manager' );
		$manager_property->setAccessible( true );
		$manager_property->setValue( $this->rest_authentication, $this->manager );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown() {
		parent::tearDown();

		$_GET = null;
		unset( $_SERVER['REQUEST_METHOD'] );
		$this->rest_authentication->reset_saved_auth_state();
	}

	/**
	 * Tests wp_rest_authentication_errors with an incoming error.
	 *
	 * @covers REST_Authentication::wp_rest_authentication_errors
	 */
	public function test_wp_rest_authentication_errors_existing_error() {
		$error = new \WP_Error( 'test_error', 'This is a test error' );
		$this->assertEquals( $error, $this->rest_authentication->wp_rest_authentication_errors( $error ) );
	}

	/**
	 * Tests wp_rest_authentication with an incoming user id.
	 *
	 * @covers REST_Authentication::wp_rest_authentication
	 */
	public function test_wp_rest_authentication_existing_user() {
		$user_id = 123;
		$this->assertEquals( $user_id, $this->rest_authentication->wp_rest_authenticate( $user_id ) );
	}

	/**
	 * Tests wp_rest_authentication with an incoming user id.
	 *
	 * @param array $test_inputs      The array containing the test inputs.
	 * @param array $expected_outputs The array containg the expected test outputs.
	 *
	 * @covers REST_Authentication::wp_rest_authentication
	 * @dataProvider wp_rest_authenticate_data_provider
	 */
	public function test_wp_rest_authenticate( $test_inputs, $expected_outputs ) {
		$_GET = $test_inputs['get_params'];
		if ( isset( $test_inputs['request_method'] ) ) {
			$_SERVER['REQUEST_METHOD'] = $test_inputs['request_method'];
		}

		$this->manager->expects( $this->any() )
			->method( 'verify_xml_rpc_signature' )
			->will( $this->returnValue( $test_inputs['verified'] ) );

		$this->assertEquals( $expected_outputs['authenticate'], $this->rest_authentication->wp_rest_authenticate( '' ) );

		if ( is_string( $expected_outputs['errors'] ) ) {
			$this->assertInstanceOf( $expected_outputs['errors'], $this->rest_authentication->wp_rest_authentication_errors( null ) );
		} else {
			$this->assertEquals( $expected_outputs['errors'], $this->rest_authentication->wp_rest_authentication_errors( null ) );
		}
	}

	/**
	 * The data provider for test_wp_rest_authenticate.
	 *
	 * @return array An array containg the test inputs and expected outputs. Each test array has the format:
	 *     ['test_inputs'] => [
	 *         ['get'] =>
	 *             ['_for'] => (string) The _for parameter value. Optional.
	 *             ['token'] => (string) The token parameter value. Optional.
	 *             ['signature'] => (string) The signature parameter value. Optional.
	 *         ['request_method'] => (string) The request method. Optional.
	 *         ['verified'] => (false|array) The mocked return value of Manager::verify_xml_rpc_signature. Required.
	 *     ],
	 *     ['test_outputs'] => [
	 *         ['authenticate'] (int|null) The expected return value of wp_rest_authenticate. Required.
	 *         ['errors'] (null|string|true) The expected return value of wp_rest_authenticate_errors. If the value is
	 *                                       a string, this is the expected class of the object returned by
	 *                                       wp_rest_authenticate_errors. Required.
	 *     ]
	 */
	public function wp_rest_authenticate_data_provider() {
		$token_data = array(
			'type'      => 'user',
			'token_key' => '123abc',
			'user_id'   => 123,
		);

		return array(
			'no for parameter'                => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'GET',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => null,
				),
			),
			'for parameter is not jetpack'    => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for'      => 'not_jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'GET',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => null,
				),
			),
			'no token or signature parameter' => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for' => 'jetpack',
					),
					'request_method' => 'GET',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => null,
				),
			),
			'no request method'               => array(
				'test_inputs'  => array(
					'get_params' => array(
						'_for'      => 'jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'verified'   => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => 'WP_Error',
				),
			),
			'invalid request method'          => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for'      => 'jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'DELETE',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => 'WP_Error',
				),
			),
			'successful GET request'          => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for'      => 'jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'GET',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => $token_data['user_id'],
					'errors'       => true,
				),
			),
			'successful POST request'         => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for'      => 'jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'POST',
					'verified'       => $token_data,
				),
				'test_outputs' => array(
					'authenticate' => $token_data['user_id'],
					'errors'       => true,
				),
			),
			'signature verification failed'   => array(
				'test_inputs'  => array(
					'get_params'     => array(
						'_for'      => 'jetpack',
						'token'     => 'token',
						'signature' => 'signature',
					),
					'request_method' => 'GET',
					'verified'       => false,
				),
				'test_outputs' => array(
					'authenticate' => null,
					'errors'       => 'WP_Error',
				),
			),
		);
	}
}
