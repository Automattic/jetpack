<?php

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

/**
 * Test class for Jetpack
 *
 * @covers Jetpack
 */
class WP_Test_Jetpack_REST_API_Authentication extends WP_Test_Jetpack_REST_Testcase {
	protected static $admin_id;

	protected $request;

	protected static $SAVE_SERVER_KEYS = array( 'HTTP_HOST', 'REQUEST_URI', 'REQUEST_METHOD' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
	/**
	 * Server values.
	 *
	 * @var array
	 */
	protected $server_values = array();

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		foreach ( self::$SAVE_SERVER_KEYS as $key ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			if ( isset( $_SERVER[ $key ] ) ) {
				$this->server_values[ $key ] = $_SERVER[ $key ];
			} else {
				unset( $this->server_values[ $key ] );
			}
		}
		$_GET['_for'] = 'jetpack';
		add_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();
		unset(
			$_SERVER['HTTP_CONTENT_TYPE'],
			$_GET['_for'],
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			$_GET['signature']
		);
		foreach ( self::$SAVE_SERVER_KEYS as $key ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			if ( isset( $this->server_values[ $key ] ) ) {
				$_SERVER[ $key ] = $this->server_values[ $key ];
			} else {
				unset( $_SERVER[ $key ] );
			}
		}
		remove_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		wp_set_current_user( 0 );
		$jetpack = Jetpack::init(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}

	/**
	 * @author roccotripaldi
	 */
	public function test_jetpack_rest_api_authentication_fail_no_token_or_signature() {
		$this->request        = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response             = $this->server->dispatch( $this->request );
		$expected_status_code = rest_authorization_required_code();

		$this->assertErrorResponse( 'rest_forbidden', $response, $expected_status_code );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_authentication_fail_no_token() {
		$_GET['signature'] = 'invalid';
		$this->request     = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response          = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response, 400 );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_authentication_fail_no_signature() {
		$_GET['token'] = 'invalid';
		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response      = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response, 400 );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author roccotripaldi
	 */
	public function test_jetpack_rest_api_authentication_fail_invalid_token() {
		$_GET['token']     = 'invalid';
		$_GET['signature'] = 'invalid';
		$this->request     = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response          = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response, 400 );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_authentication_fail_bad_nonce() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing_123';
		$_GET['body-hash'] = '';
		$_GET['signature'] = 'abc';
		$this->request     = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response          = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response );
		$this->assertEquals( 400, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'The request is not signed correctly.', $data['message'] );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_authentication_fail_bad_signature() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = '';
		$_GET['signature'] = 'abc';
		$this->request     = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response          = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response, 400 );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_get_authentication_success() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = '';
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						$_GET['body-hash'],
						'GET',
						'example.org',
						'80',
						'/jetpack/v4/module/protect',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);
		$this->request     = new WP_REST_Request( 'GET', '/jetpack/v4/module/protect' );
		$response          = $this->server->dispatch( $this->request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'Brute force protection', $data['name'] );
		$this->assertEquals( self::$admin_id, get_current_user_id() );
	}

	/**
	 * Test Core REST API Authentication with blog token.
	 *
	 * @author fgiannar
	 */
	public function test_jetpack_rest_api_get_authentication_success_with_blog_token() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$token     = 'pretend_this_is_valid_blog_token:1:0';
		$timestamp = (string) time();
		$nonce     = 'testing123';
		$body_hash = '';

		$_GET['token']     = $token;
		$_GET['timestamp'] = $timestamp;
		$_GET['nonce']     = $nonce;
		$_GET['body-hash'] = $body_hash;
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$token,
						$timestamp,
						$nonce,
						$body_hash,
						'GET',
						'example.org',
						'80',
						'/jetpack/v4/purchase-token',
						'qstest=yep',
					)
				) . "\n",
				'secret_blog',
				true
			)
		);

		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/purchase-token' );
		$response      = $this->server->dispatch( $this->request );
		// "Success" here is a 500, since the site is not registered.
		// Check error code and params info to make sure we've made it through
		// the auth code.
		$this->assertEquals( 500, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'site_not_registered', $data['code'] );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_post_authentication_fail_bad_signature() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = Jetpack::connection()->sha1_base64( '{"modules":[]}' );
		$_GET['signature'] = 'abc';
		$this->request     = new WP_REST_Request( 'POST', '/jetpack/v4/module/all/active' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( '{"modules":[]}' );
		$response = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response, 400 );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_post_authentication_fail_bad_body_hash() {
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = 'abc';
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						Jetpack::connection()->sha1_base64( '{"modules":[]}' ),
						'GET',
						'example.org',
						'80',
						'/jetpack/v4/module/protect',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);
		$this->request     = new WP_REST_Request( 'POST', '/jetpack/v4/module/all/active' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( '{"modules":[]}' );
		$response = $this->server->dispatch( $this->request );
		$this->assertErrorResponse( 'rest_invalid_signature', $response );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertSame( 0, get_current_user_id() );
	}

	/**
	 * @author jnylen0
	 */
	public function test_jetpack_rest_api_post_authentication_success() {
		$_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';
		$body                         = '{"modules":[]}';

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );

		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = Jetpack::connection()->sha1_base64( $body );
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						$_GET['body-hash'],
						'POST',
						'example.org',
						'80',
						'/jetpack/v4/module/all/active',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);

		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/module/all/active' );
		$this->request->set_header( 'Content-Type', $_SERVER['HTTP_CONTENT_TYPE'] );
		$this->request->set_body( $body );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		// Success here is a 200. When we pass an empty array of modules,
		// there's nothing to do.
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertEquals( self::$admin_id, get_current_user_id() );
	}

	/**
	 * Test for urlencoded request
	 */
	public function test_jetpack_rest_api_post_urlencoded_authentication_success() {
		$_SERVER['HTTP_CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
		$body                         = 'modules[]=nope';

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );

		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = Jetpack::connection()->sha1_base64( $body );
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						$_GET['body-hash'],
						'POST',
						'example.org',
						'80',
						'/jetpack/v4/module/all/active',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);

		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/module/all/active' );
		$this->request->set_header( 'Content-Type', $_SERVER['HTTP_CONTENT_TYPE'] );
		$this->request->set_body( $body );
		$this->request->set_body_params( wp_parse_args( $body ) );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		// "Success" here is a 400, since we passed in an invalid module name.
		// Check error code and params info to make sure we've made it through
		// the auth code. "success" is an activate_modules() - not an auth error.
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
		$this->assertEquals( 'modules must be a list of valid modules', $data['data']['params']['modules'] );
		$this->assertEquals( self::$admin_id, get_current_user_id() );
	}

	/**
	 * Test for multipart request
	 */
	public function test_jetpack_rest_api_post_multipart_authentication_success() {
		$_SERVER['HTTP_CONTENT_TYPE'] = 'multipart/form-data; boundary=------------------------test';

		// Even though we're sending multipart/form-data, Jetpack always signs
		// application/x-www-form-urlencoded-like data (typically generated from $_POST).
		$body = '_jetpack_is_multipart=1&modules%5B0%5D=nope';

		// Populate $_POST like Jetpack expects
		$original_post = isset( $_POST ) ? $_POST : 'unset';
		parse_str( $body, $GLOBALS['_POST'] );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );

		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = Jetpack::connection()->sha1_base64( $body );
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						$_GET['body-hash'],
						'POST',
						'example.org',
						'80',
						'/jetpack/v4/module/all/active',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);

		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/module/all/active' );
		$this->request->set_header( 'Content-Type', $_SERVER['HTTP_CONTENT_TYPE'] );
		$this->request->set_body( '' ); // file_get_contents( 'php://input' ) returns '' for multipart/form-data
		$this->request->set_body_params( $_POST );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		if ( 'unset' === $original_post ) {
			unset( $GLOBALS['_POST'] );
		} else {
			$GLOBALS['_POST'] = $original_post;
		}

		// "Success" here is a 400, since we passed in an invalid module name.
		// Check error code and params info to make sure we've made it through
		// the auth code. "success" is an activate_modules() - not an auth error.
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
		$this->assertEquals( 'modules must be a list of valid modules', $data['data']['params']['modules'] );
		$this->assertEquals( self::$admin_id, get_current_user_id() );
	}

	public function mock_jetpack_private_options( $value, $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$user_tokens                    = array();
		$user_tokens[ self::$admin_id ] = 'pretend_this_is_valid.secret.' . self::$admin_id;
		return array(
			'user_tokens' => $user_tokens,
			'blog_token'  => 'pretend_this_is_valid_blog_token.secret_blog',
		);
	}

	/**
	 * Ensures that these tests pass through Jetpack::wp_rest_authenticate,
	 * because WP_REST_Server::dispatch doesn't call any auth logic (in a real
	 * request, this would all happen earlier).
	 */
	public function rest_pre_dispatch( $result, $server ) {
		// Reset Jetpack::xmlrpc_verification saved state
		$jetpack = Jetpack::init(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		Connection_Rest_Authentication::init()->reset_saved_auth_state();
		// Set POST body for Jetpack::verify_xml_rpc_signature
		$GLOBALS['HTTP_RAW_POST_DATA'] = $this->request->get_body();
		// Set host and URL for Jetpack_Signature::sign_current_request
		$_SERVER['HTTP_HOST']      = 'example.org';
		$_SERVER['REQUEST_URI']    = $this->request->get_route() . '?qstest=yep';
		$_SERVER['REQUEST_METHOD'] = $this->request->get_method();
		$user_id                   = apply_filters( 'determine_current_user', false );
		if ( $user_id ) {
			wp_set_current_user( $user_id );
		}
		$auth = $server->check_authentication( null );
		if ( true === $auth ) {
			return $result;
		}
		return $auth;
	}
}
// phpcs:enable
