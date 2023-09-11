<?php

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Automated testing of the post-by-email REST API.
 *
 * @package automattic/jetpack
 */

if ( defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/post-by-email.php';
}

/**
 * Automated testing of the post-by-email REST API.
 */
class WP_Test_Post_By_Email_API extends WP_Test_Jetpack_REST_Testcase {

	/**
	 * User ID for the temporary admin user.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * The REST API Request object.
	 *
	 * @var WP_REST_Request
	 */
	protected $request;

	/**
	 * Keys for the values from $_SERVER that need to be preserved.
	 * The keys are going to be reverted to their original values by the `self::tear_down()` function.
	 *
	 * @var array
	 */
	protected static $save_server_keys = array( 'HTTP_HOST', 'REQUEST_URI', 'REQUEST_METHOD' );

	/**
	 * Temporary storage for the $_SERVER values that need to be preserved.
	 *
	 * @var array
	 */
	protected $server_values = array();

	/**
	 * The flag indicates that function `self::mock_jetpack_api_response()` has been run.
	 * Unfortunately it's easy to skip execution of a function hooked to an action/filter,
	 * so we need this flag to verify that Jetpack API request validation wasn't skipped.
	 *
	 * @var bool
	 */
	private $request_validated;

	const SAMPLE_EMAIL = 'sample.email@post.wordpress.com';

	const PBE_API_ENDPOINT = '/jetpack/v4/settings';

	/**
	 * Initialize the test class.
	 *
	 * @param WP_UnitTest_Factory $factory The fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		foreach ( self::$save_server_keys as $key ) {
			if ( isset( $_SERVER[ $key ] ) ) {
				$this->server_values[ $key ] = $_SERVER[ $key ];
			} else {
				unset( $this->server_values[ $key ] );
			}
		}

		$_GET['_for'] = 'jetpack';

		add_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100, 2 );
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10 );

		$_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';

		$this->request = new WP_REST_Request( 'POST', self::PBE_API_ENDPOINT );
		$this->request->set_header( 'Content-Type', $_SERVER['HTTP_CONTENT_TYPE'] );

		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';

		$this->request_validated = false;
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10 );
		remove_filter( 'rest_pre_dispatch', array( $this, 'rest_pre_dispatch' ), 100 );

		parent::tear_down();

		unset( $_SERVER['HTTP_CONTENT_TYPE'], $_GET['_for'], $_GET['token'], $_GET['timestamp'], $_GET['nonce'], $_GET['body-hash'], $_GET['signature'] ); // phpcs:ignore

		foreach ( self::$save_server_keys as $key ) {
			if ( isset( $this->server_values[ $key ] ) ) {
				$_SERVER[ $key ] = $this->server_values[ $key ];
			} else {
				unset( $_SERVER[ $key ] );
			}
		}

		wp_set_current_user( 0 );
	}

	/**
	 * Test the endpoint `post_by_email_address => create`.
	 */
	public function test_create() {
		add_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_create' ), 10, 3 );

		$response = $this->rest_dispatch( 'create' );

		$this->assertEquals( 'success', $response->data['code'] );
		$this->assertEquals( self::SAMPLE_EMAIL, $response->data['post_by_email_address'] );
		$this->assertEquals( 200, $response->status );
		$this->assertTrue( $this->request_validated, "Method 'mock_jetpack_api_response_create' was skipped, failed to validate the request" );

		remove_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_create' ), 10 );
	}

	/**
	 * Test the endpoint `post_by_email_address => regenerate`.
	 */
	public function test_regenerate() {
		add_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_regenerate' ), 10, 3 );

		$response = $this->rest_dispatch( 'regenerate' );

		$this->assertEquals( 'success', $response->data['code'] );
		$this->assertEquals( self::SAMPLE_EMAIL, $response->data['post_by_email_address'] );
		$this->assertEquals( 200, $response->status );
		$this->assertTrue( $this->request_validated, "Method 'mock_jetpack_api_response_regenerate' was skipped, failed to validate the request" );

		remove_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_regenerate' ), 10 );
	}

	/**
	 * Test the endpoint `post_by_email_address => delete`.
	 */
	public function test_delete() {
		add_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_delete' ), 10, 3 );

		$response = $this->rest_dispatch( 'delete' );

		$this->assertEquals( 'success', $response->data['code'] );
		$this->assertEquals( 200, $response->status );
		$this->assertTrue( $this->request_validated, "Method 'mock_jetpack_api_response_delete' was skipped, failed to validate the request" );

		remove_filter( 'pre_http_request', array( $this, 'mock_jetpack_api_response_delete' ), 10 );
	}

	/**
	 * Most the user token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		$user_tokens                    = array();
		$user_tokens[ self::$admin_id ] = 'pretend_this_is_valid.secret.' . self::$admin_id;

		return array(
			'user_tokens' => $user_tokens,
		);
	}

	/**
	 * Ensures that these tests pass through Jetpack::wp_rest_authenticate,
	 * because WP_REST_Server::dispatch doesn't call any auth logic (in a real
	 * request, this would all happen earlier).
	 *
	 * @param mixed          $result Response to replace the requested version with.
	 * @param WP_Rest_Server $server Server instance.
	 *
	 * @return WP_Error|null WP_Error indicates unsuccessful login, null indicates successful or no authentication provided.
	 */
	public function rest_pre_dispatch( $result, $server ) {
		// Reset Jetpack::xmlrpc_verification saved state.
		Connection_Rest_Authentication::init()->reset_saved_auth_state();

		// Set POST body for Jetpack::verify_xml_rpc_signature.
		$GLOBALS['HTTP_RAW_POST_DATA'] = $this->request->get_body(); // phpcs:ignore

		// Set host and URL for Jetpack_Signature::sign_current_request.
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

	/**
	 * Validate the "Create" Jetpack API request and mock the response.
	 *
	 * @param false|array|WP_Error $response     Whether to preempt an HTTP request's return value. Default false.
	 * @param array                $args         HTTP request arguments.
	 * @param string               $url          The request URL.
	 *
	 * @return array
	 */
	public function mock_jetpack_api_response_create( $response, $args, $url ) {
		$this->assertEquals( 'POST', $args['method'] );
		$this->assertStringContainsString( '<methodName>jetpack.createPostByEmailAddress</methodName>', $args['body'] );
		$this->assertStringStartsWith( 'https://jetpack.wordpress.com/xmlrpc.php', $url );
		$this->request_validated = true;

		return array(
			'headers'  => array(),
			'body'     => '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>' . self::SAMPLE_EMAIL . '</string></value></param></params></methodResponse>',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "Regenerate" Jetpack API request and mock the response.
	 *
	 * @param false|array|WP_Error $response     Whether to preempt an HTTP request's return value. Default false.
	 * @param array                $args         HTTP request arguments.
	 * @param string               $url          The request URL.
	 *
	 * @return array
	 */
	public function mock_jetpack_api_response_regenerate( $response, $args, $url ) {
		$this->assertEquals( 'POST', $args['method'] );
		$this->assertStringContainsString( '<methodName>jetpack.regeneratePostByEmailAddress</methodName>', $args['body'] );
		$this->assertStringStartsWith( 'https://jetpack.wordpress.com/xmlrpc.php', $url );
		$this->request_validated = true;

		return array(
			'headers'  => array(),
			'body'     => '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><string>' . self::SAMPLE_EMAIL . '</string></value></param></params></methodResponse>',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "Delete" Jetpack API request and mock the response.
	 *
	 * @param false|array|WP_Error $response     Whether to preempt an HTTP request's return value. Default false.
	 * @param array                $args         HTTP request arguments.
	 * @param string               $url          The request URL.
	 *
	 * @return array
	 */
	public function mock_jetpack_api_response_delete( $response, $args, $url ) {
		$this->assertEquals( 'POST', $args['method'] );
		$this->assertStringContainsString( '<methodName>jetpack.deletePostByEmailAddress</methodName>', $args['body'] );
		$this->assertStringStartsWith( 'https://jetpack.wordpress.com/xmlrpc.php', $url );
		$this->request_validated = true;

		return array(
			'headers'  => array(),
			'body'     => '<?xml version="1.0" encoding="UTF-8"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Prepare and send the API request.
	 *
	 * @param string $action API action to be sent.
	 *
	 * @return WP_REST_Response
	 */
	private function rest_dispatch( $action ) {
		$body = wp_json_encode( array( 'post_by_email_address' => $action ) );
		$this->request->set_body( $body );
		$_GET['body-hash'] = Jetpack::connection()->sha1_base64( $body );

		$dataset = array(
			$_GET['token'],
			$_GET['timestamp'],
			$_GET['nonce'],
			$_GET['body-hash'],
			'POST',
			'example.org',
			'80',
			self::PBE_API_ENDPOINT,
			'qstest=yep',
		);

		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode( "\n", $dataset ) . "\n",
				'secret',
				true
			)
		);

		return $this->server->dispatch( $this->request );
	}

}
