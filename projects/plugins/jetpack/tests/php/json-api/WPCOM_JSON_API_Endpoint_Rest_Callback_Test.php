<?php
/**
 * WPCOM_JSON_API_Endpoint::rest_callback() unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Endpoint_Rest_Callback_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for the WPCOM_JSON_API_Endpoint::rest_callback() method.
 *
 * @covers \WPCOM_JSON_API_Endpoint::rest_callback
 * @covers \WPCOM_JSON_API_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Endpoint::class )]
#[CoversMethod( WPCOM_JSON_API_Endpoint::class, 'rest_callback' )]
class WPCOM_JSON_API_Endpoint_Rest_Callback_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * An admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * The current blog ID.
	 *
	 * @var int
	 */
	private static $blog_id;

	/**
	 * Keys for the values from $_SERVER that need to be preserved.
	 *
	 * @var array
	 */
	private static $save_server_keys = array( 'HTTP_HOST', 'REQUEST_URI', 'REQUEST_METHOD' );

	/**
	 * Temporary storage for the $_SERVER values.
	 *
	 * @var array
	 */
	private $server_values = array();

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'GET';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param WP_UnitTest_Factory $factory A factory object.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$blog_id       = $GLOBALS['blog_id'];
	}

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		// Save server values.
		foreach ( self::$save_server_keys as $key ) {
			if ( isset( $_SERVER[ $key ] ) ) {
				$this->server_values[ $key ] = $_SERVER[ $key ];
			} else {
				unset( $this->server_values[ $key ] );
			}
		}

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => self::$blog_id );
		wp_set_current_user( self::$admin_user_id );
	}

	/**
	 * Reset the environment after each test.
	 */
	public function tear_down() {
		// Remove any filters we added.
		remove_all_filters( 'pre_option_jetpack_private_options' );

		// Restore server values.
		foreach ( self::$save_server_keys as $key ) {
			if ( isset( $this->server_values[ $key ] ) ) {
				$_SERVER[ $key ] = $this->server_values[ $key ];
			} else {
				unset( $_SERVER[ $key ] );
			}
		}

		// Clean up GET variables.
		unset( $_GET['token'], $_GET['timestamp'], $_GET['nonce'], $_GET['body-hash'], $_GET['signature'] );

		// Reset auth state if available.
		if ( class_exists( Connection_Rest_Authentication::class ) ) {
			Connection_Rest_Authentication::init()->reset_saved_auth_state();
		}

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Create a mock WP_REST_Request.
	 *
	 * @param array $params URL parameters.
	 * @param array $query Query parameters.
	 * @return WP_REST_Request
	 */
	private function create_rest_request( $params = array(), $query = array() ) {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/test' );
		$request->set_url_params( $params );
		foreach ( $query as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return $request;
	}

	/**
	 * Test that rest_callback returns error when in testing mode.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_returns_error_when_in_testing_mode() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		// Set in_testing to true - this check happens before auth.
		$endpoint->in_testing = true;

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'endpoint_not_available', $response->get_error_code() );
	}

	/**
	 * Test that rest_callback returns error when signature verification fails.
	 *
	 * When $_GET['token'] and $_GET['signature'] are not set,
	 * verify_xml_rpc_signature() returns false.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_returns_error_when_signature_verification_fails() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		// Don't set up any auth - signature verification will fail.
		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'response_signature_error', $response->get_error_code() );
	}

	/**
	 * Test that rest_callback returns error when token lookup fails.
	 *
	 * When token data is provided but the token doesn't exist in the database,
	 * the method returns response_signature_error.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_returns_error_when_token_not_found() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		// Set up partial auth - token format is valid but token doesn't exist.
		$_GET['token']     = 'nonexistent_token:1:' . self::$admin_user_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['signature'] = 'invalid_signature';

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		// The error is response_signature_error because signature verification fails.
		$this->assertSame( 'response_signature_error', $response->get_error_code() );
	}

	/**
	 * Test that rest_callback initializes the API properly.
	 *
	 * This tests that the method sets up the API object correctly
	 * before any authentication checks.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_initializes_api() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
				'path' => '/test/path',
			)
		);

		// Use in_testing to trigger early exit so we can check API state.
		$endpoint->in_testing = true;

		$request = $this->create_rest_request();
		$endpoint->rest_callback( $request );

		// Verify API was initialized and endpoint was set.
		$api = WPCOM_JSON_API::init();
		$this->assertSame( $endpoint, $api->endpoint );
		$this->assertSame( '/test/path', $api->path );
	}

	/**
	 * Test that rest_callback adds required filters.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_adds_filters() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		// Remove filters first to ensure clean state.
		remove_all_filters( 'user_can_richedit' );
		remove_all_filters( 'comment_edit_pre' );

		// Use in_testing to trigger early exit.
		$endpoint->in_testing = true;

		$request = $this->create_rest_request();
		$endpoint->rest_callback( $request );

		// Verify filters were added.
		$this->assertTrue( has_filter( 'user_can_richedit' ) !== false );
		$this->assertTrue( has_filter( 'comment_edit_pre' ) !== false );
	}

	/**
	 * Test that rest_callback handles language parameter.
	 *
	 * This tests that the locale initialization is called when
	 * the language parameter is provided, even though auth will fail.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_handles_language_parameter() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		// We can't easily verify locale was set, but we can verify
		// the method doesn't error when language is provided.
		$request  = $this->create_rest_request( array(), array( 'language' => 'es' ) );
		$response = $endpoint->rest_callback( $request );

		// Should fail auth, not language handling.
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'response_signature_error', $response->get_error_code() );
	}

	/**
	 * Test that in_testing mode respects WPCOM_JSON_API__DEBUG constant.
	 *
	 * When WPCOM_JSON_API__DEBUG is true (which it is in tests),
	 * the in_testing check should be bypassed.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_in_testing_respects_debug_constant() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
			)
		);

		$endpoint->in_testing = true;

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		// When WPCOM_JSON_API__DEBUG is true, in_testing is ignored
		// and the method proceeds to signature verification.
		if ( WPCOM_JSON_API__DEBUG ) {
			// Should fail at signature verification, not in_testing check.
			$this->assertInstanceOf( WP_Error::class, $response );
			$this->assertSame( 'response_signature_error', $response->get_error_code() );
		} else {
			// Should fail at in_testing check.
			$this->assertInstanceOf( WP_Error::class, $response );
			$this->assertSame( 'endpoint_not_available', $response->get_error_code() );
		}
	}

	/**
	 * Test that rest_callback successfully executes callback and returns signed response.
	 *
	 * This test sets up proper authentication mocking to test the full flow
	 * through rest_callback(), including callback execution and response signing.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_successful_execution() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
				'path' => '/test/endpoint',
			)
		);

		// Set up the expected callback result.
		$expected_result           = array(
			'status'  => 'success',
			'message' => 'Test completed',
		);
		$endpoint->callback_result = $expected_result;

		// Set up authentication mocking.
		$this->set_up_authentication();

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		// Verify successful response structure.
		$this->assertIsArray( $response, 'Response should be an array on success' );
		$this->assertCount( 3, $response, 'Response should contain [json, nonce, hmac]' );

		// First element: JSON-encoded response.
		$json_response = $response[0];
		$this->assertIsString( $json_response );
		$decoded = json_decode( $json_response, true );
		$this->assertSame( $expected_result, $decoded, 'Decoded JSON should match callback result' );

		// Second element: nonce (10-character alphanumeric string).
		$nonce = $response[1];
		$this->assertIsString( $nonce );
		$this->assertSame( 10, strlen( $nonce ), 'Nonce should be 10 characters' );

		// Third element: HMAC signature.
		$hmac = $response[2];
		$this->assertIsString( $hmac );

		// Verify HMAC is correct (using the known secret from mock tokens).
		$expected_hmac = hash_hmac( 'sha1', $nonce . $json_response, 'pretend_this_is_valid.secret' );
		$this->assertSame( $expected_hmac, $hmac, 'HMAC should be correctly computed' );
	}

	/**
	 * Test that rest_callback wraps WP_Error response from callback.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_handles_wp_error_from_callback() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
				'path' => '/test/endpoint',
			)
		);

		// Set callback to return WP_Error.
		$endpoint->callback_result = new WP_Error( 'test_error', 'Something went wrong', 400 );

		// Set up authentication mocking.
		$this->set_up_authentication();

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		// Verify response structure.
		$this->assertIsArray( $response );
		$this->assertCount( 3, $response );

		// Decode and verify error is serialized.
		$decoded = json_decode( $response[0], true );
		$this->assertIsArray( $decoded );
		$this->assertIsArray( $decoded['errors'] );
		$this->assertSame( 'test_error', $decoded['errors']['error'] );
		$this->assertSame( 'Something went wrong', $decoded['errors']['message'] );
	}

	/**
	 * Test that rest_callback wraps response in HTTP envelope when requested.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_http_envelope_wrapping() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
				'path' => '/test/endpoint',
			)
		);

		$endpoint->callback_result = array( 'data' => 'test' );

		// Set up authentication mocking.
		$this->set_up_authentication();

		// Request with HTTP envelope.
		$request  = $this->create_rest_request( array(), array( 'http_envelope' => true ) );
		$response = $endpoint->rest_callback( $request );

		// Verify response structure.
		$this->assertIsArray( $response );
		$this->assertCount( 3, $response );

		// Decode and verify envelope structure.
		$decoded = json_decode( $response[0], true );
		$this->assertIsArray( $decoded );
		$this->assertArrayHasKey( 'code', $decoded );
		$this->assertSame( 200, $decoded['code'] );
		$this->assertArrayHasKey( 'body', $decoded );
		$this->assertSame( array( 'data' => 'test' ), $decoded['body'] );
	}

	/**
	 * Test that rest_callback handles empty callback result as error.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_callback_handles_empty_callback_result() {
		$endpoint = new WPCOM_JSON_API_Rest_Callback_Test_Endpoint(
			array(
				'stat' => 'test',
				'path' => '/test/endpoint',
			)
		);

		// Set callback to return null (empty response).
		$endpoint->callback_result = null;

		// Set up authentication mocking.
		$this->set_up_authentication();

		$request  = $this->create_rest_request();
		$response = $endpoint->rest_callback( $request );

		// Verify response structure.
		$this->assertIsArray( $response );
		$this->assertCount( 3, $response );

		// Decode and verify error response.
		$decoded = json_decode( $response[0], true );
		$this->assertIsArray( $decoded );
		$this->assertIsArray( $decoded['errors'] );
		$this->assertSame( 'empty_response', $decoded['errors']['error'] );
	}

	/**
	 * Set up authentication mocking for successful rest_callback execution.
	 *
	 * This method sets up all the necessary $_GET variables and filters
	 * to allow rest_callback to pass signature verification.
	 */
	private function set_up_authentication() {
		// Reset auth state.
		if ( class_exists( Connection_Rest_Authentication::class ) ) {
			Connection_Rest_Authentication::init()->reset_saved_auth_state();
		}

		// Mock jetpack private options to provide tokens.
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );

		// Set up request environment.
		$_SERVER['HTTP_HOST']      = 'example.org';
		$_SERVER['REQUEST_URI']    = '/jetpack/v4/test?qstest=yep';
		$_SERVER['REQUEST_METHOD'] = 'GET';

		// Set up authentication tokens.
		$_GET['token']     = 'pretend_this_is_valid:1:' . self::$admin_user_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';

		// Generate valid signature.
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						'',
						'GET',
						'example.org',
						'80',
						'/jetpack/v4/test',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);
	}

	/**
	 * Mock jetpack private options to provide test tokens.
	 *
	 * @param mixed  $value       The option value.
	 * @param string $option_name The option name.
	 * @return array The mocked options.
	 */
	public function mock_jetpack_private_options( $value, $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$user_tokens                         = array();
		$user_tokens[ self::$admin_user_id ] = 'pretend_this_is_valid.secret.' . self::$admin_user_id;
		return array(
			'user_tokens' => $user_tokens,
			'blog_token'  => 'pretend_this_is_valid_blog_token.secret_blog',
		);
	}
}

/**
 * Test endpoint for testing rest_callback().
 *
 * This is a minimal concrete implementation that allows testing the parent's
 * rest_callback() method directly.
 */
class WPCOM_JSON_API_Rest_Callback_Test_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Whether the endpoint is in testing mode.
	 *
	 * @var bool
	 */
	public $in_testing = false;

	/**
	 * Mock callback result for testing.
	 *
	 * @var mixed
	 */
	public $callback_result = array( 'status' => 'success' );

	/**
	 * Callback method implementation.
	 *
	 * @param string $path The request path.
	 * @param int    $blog_id The blog ID.
	 * @return mixed
	 */
	public function callback( $path = '', $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->callback_result;
	}
}
