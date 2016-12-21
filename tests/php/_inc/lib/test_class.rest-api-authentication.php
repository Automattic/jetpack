<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

class WP_Test_Jetpack_REST_API_Authentication extends WP_Test_Jetpack_REST_Testcase {
	protected static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array(
			'role' => 'administrator',
		) );
	}

	public function setUp() {
		parent::setUp();
		add_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
	}

	public function tearDown() {
		parent::tearDown();
		unset( $_GET['token'], $_GET['signature'] );
		remove_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
		wp_set_current_user( 0 );
		remove_filter( 'rest_authentication_errors', array( $this, 'verify_signature_true' ), 1000 );
	}

	/**
	 * @author roccotripaldi
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_fail_no_token_or_signature() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		// From https://github.com/WordPress/WordPress/blob/4.7/wp-includes/rest-api/class-wp-rest-server.php#L902
		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * @author jnylen0
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_fail_no_token() {
		$_GET['signature'] = 'invalid';
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'token_malformed', $response, 400 );
	}

	/**
	 * @author jnylen0
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_fail_no_signature() {
		$_GET['token'] = 'invalid';
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'token_malformed', $response, 400 );
	}

	/**
	 * @author roccotripaldi
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_fail_invalid_token() {
		$_GET['token'] = 'invalid';
		$_GET['signature'] = 'invalid';
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'token_malformed', $response, 400 );
	}

	/**
	 * @author roccotripaldi
	 * @covers Jetpack->wp_rest_authenticate
	 * @requires PHP 5.2
	 */
	public function test_jetpack_rest_api_authentication_success() {
		add_filter( 'rest_authentication_errors', array( $this, 'verify_signature_true' ), 1000 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Protect', $data['name'] );
	}

	/**
	 * Emulates a successful run through Jetpack::wp_rest_authenticate and Jetpack::verify_xml_rpc_signature
	 * without having to actually call Jetpack Server to verify signature.
	 *
	 * @return null
	 */
	public function verify_signature_true() {
		wp_set_current_user( self::$admin_id );
		return null;
	}

	/**
	 * Ensures that these tests pass through Jetpack::wp_rest_authenticate,
	 * otherwise WP_REST_Server::dispatch doesn't bother to check authorization.
	 */
	public function rest_pre_dispatch( $result, $server ) {
		$auth = $server->check_authentication();
		if ( true === $auth ) {
			return $result;
		}
		return $auth;
	}
}
