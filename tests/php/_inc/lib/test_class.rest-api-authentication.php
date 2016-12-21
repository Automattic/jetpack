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
		unset(
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			$_GET['signature']
		);
		remove_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		wp_set_current_user( 0 );
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
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token'] = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce'] = 'testing_123';
		$_GET['body-hash'] = '';
		$_GET['signature'] = 'abc';
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response = $this->server->dispatch( $request );
		error_log( $response->get_data() );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Protect', $data['name'] );
	}

	public function mock_jetpack_private_options( $value, $option_name ) {
		$user_tokens = array();
		$user_tokens[ self::$admin_id ] = 'pretend_this_is_valid.secret.' . self::$admin_id;
		return array(
			'user_tokens' => $user_tokens,
		);
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
