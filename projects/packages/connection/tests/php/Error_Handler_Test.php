<?php
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Connection Manager functionality testing.
 */
class Error_Handler_Test extends BaseTestCase {

	/**
	 * Error_Handler instance.
	 *
	 * @var Error_Handler
	 */
	public $error_handler;

	/**
	 * Initialize tests
	 */
	public function set_up() {
		$this->error_handler = Error_Handler::get_instance();
	}

	/**
	 * Generates a sample WP_Error object in the same format Manager class does for broken signatures
	 *
	 * @param string $error_code The error code you want the error to have.
	 * @param string $user_id The user id you want the token to have.
	 * @param string $error_type The error type: 'xmlrpc' or 'rest'.
	 *
	 * @return \WP_Error
	 */
	public function get_sample_error( $error_code, $user_id, $error_type = 'xmlrpc' ) {

		$signature_details = array(
			'token'     => 'dhj938djh938d:1:' . $user_id,
			'timestamp' => time(),
			'nonce'     => 'asd3d32d',
			'body_hash' => 'dsf34frf',
			'method'    => 'POST',
			'url'       => 'https://example.org',
			'signature' => 'sdf234fe',
		);

		return new \WP_Error(
			$error_code,
			'An error was triggered',
			compact( 'signature_details', 'error_type' )
		);
	}

	/**
	 * Test storing an error
	 */
	public function test_store_error() {

		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1, 'xmlrpc' );

		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 1, $stored_errors );

		$this->assertArrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );

		$this->assertArrayHasKey( '1', $stored_errors['invalid_token'] );

		$this->assertArrayHasKey( 'nonce', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'error_code', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'user_id', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'error_message', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'error_data', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'timestamp', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'nonce', $stored_errors['invalid_token']['1'] );
		$this->assertArrayHasKey( 'error_type', $stored_errors['invalid_token']['1'] );
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );
	}

	/**
	 * Test storing errors
	 */
	public function test_store_multiple_error_codes() {

		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error  = $this->get_sample_error( 'invalid_token', 1, 'xmlrpc' );
		$error2 = $this->get_sample_error( 'unknown_user', 1, 'rest' );
		$error3 = $this->get_sample_error( 'invalid_connection_owner', 'invalid', 'connection' );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 3, $stored_errors );

		$this->assertArrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 1, $stored_errors['unknown_user'] );
		$this->assertCount( 1, $stored_errors['invalid_connection_owner'] );

		$this->assertArrayHasKey( '1', $stored_errors['unknown_user'] );

		$this->assertArrayHasKey( 'error_type', $stored_errors['invalid_token']['1'] );
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );

		$this->assertArrayHasKey( 'nonce', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'error_code', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'user_id', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'error_message', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'error_data', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'timestamp', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'nonce', $stored_errors['unknown_user']['1'] );
		$this->assertArrayHasKey( 'error_type', $stored_errors['unknown_user']['1'] );
		$this->assertEquals( 'rest', $stored_errors['unknown_user']['1']['error_type'] );

		$this->assertArrayHasKey( 'invalid', $stored_errors['invalid_connection_owner'] );
		$this->assertArrayHasKey( 'error_type', $stored_errors['invalid_connection_owner']['invalid'] );
		$this->assertEquals( 'connection', $stored_errors['invalid_connection_owner']['invalid']['error_type'] );
	}

	/**
	 * Test storing errors
	 */
	public function test_store_multiple_error_codes_multiple_users() {

		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error  = $this->get_sample_error( 'invalid_token', 1 );
		$error2 = $this->get_sample_error( 'unknown_user', 1 );
		$error3 = $this->get_sample_error( 'unknown_user', 2, 'xmlrpc' );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 2, $stored_errors );

		$this->assertArrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 2, $stored_errors['unknown_user'] );

		$this->assertArrayHasKey( '2', $stored_errors['unknown_user'] );

		$this->assertArrayHasKey( 'nonce', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'error_code', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'user_id', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'error_message', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'error_data', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'timestamp', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'nonce', $stored_errors['unknown_user']['2'] );
		$this->assertArrayHasKey( 'error_type', $stored_errors['unknown_user']['2'] );
	}

	/**
	 * Test gate
	 */
	public function test_gate() {

		$error  = $this->get_sample_error( 'invalid_token', 1 );
		$error2 = $this->get_sample_error( 'invalid_token', 1 );
		$error3 = $this->get_sample_error( 'unknown_user', 1 );

		$this->assertTrue( $this->error_handler->should_report_error( $error ) );
		$this->assertFalse( $this->error_handler->should_report_error( $error2 ), 'second attempt to report the same error code should be stopped by the gate' );
		$this->assertTrue( $this->error_handler->should_report_error( $error3 ) );
	}

	/**
	 * Test 5 errors per code
	 */
	public function test_max_five_errors_per_code() {

		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error  = $this->get_sample_error( 'unknown_user', 3 );
		$error2 = $this->get_sample_error( 'unknown_user', 4 );
		$error3 = $this->get_sample_error( 'unknown_user', 5 );
		$error4 = $this->get_sample_error( 'unknown_user', 6 );
		$error5 = $this->get_sample_error( 'unknown_user', 7 );
		$error6 = $this->get_sample_error( 'unknown_user', 8 );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );
		$this->error_handler->report_error( $error4 );
		$this->error_handler->report_error( $error5 );
		$this->error_handler->report_error( $error6 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 5, $stored_errors['unknown_user'] );

		$this->assertArrayNotHasKey( '3', $stored_errors['unknown_user'], 'first inserted error must have been excluded' );
		$this->assertArrayHasKey( '8', $stored_errors['unknown_user'], 'sixth inserted error must be present' );
	}

	/**
	 * Data provider for test_get_user_id_from_token
	 *
	 * @return array
	 */
	public static function get_user_id_from_token_data() {
		return array(
			array(
				'token'    => 'asdsaddasa:1:3',
				'expected' => 3,
			),
			array(
				'token'    => 'asdsaddasa:1:2',
				'expected' => 2,
			),
			array(
				'token'    => 'asdsaddasa:1',
				'expected' => 'invalid',
			),
			array(
				'token'    => 'asdsaddasa:1:',
				'expected' => 'invalid',
			),
			array(
				'token'    => 'asdsaddasa:1:asd',
				'expected' => 'invalid',
			),
			array(
				'token'    => 'asdsaddasa:1:333',
				'expected' => 333,
			),
		);
	}

	/**
	 * Test get_user_id_from_token
	 *
	 * @param string         $token token.
	 * @param string|integer $expected expected user_id.
	 *
	 * @dataProvider get_user_id_from_token_data
	 */
	#[DataProvider( 'get_user_id_from_token_data' )]
	public function test_get_user_id_from_token( $token, $expected ) {
		$this->assertEquals( $expected, $this->error_handler->get_user_id_from_token( $token ) );
	}

	/**
	 * Test get_error_by_nonce
	 */
	public function test_get_error_by_nonce() {
		$error  = $this->get_sample_error( 'unknown_user', 3 );
		$error2 = $this->get_sample_error( 'invalid_token', 4 );
		$error3 = $this->get_sample_error( 'no_user_tokens', 5 );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$error = $this->error_handler->get_error_by_nonce( $stored_errors['no_user_tokens']['5']['nonce'] );

		$this->assertEquals( $error, $stored_errors['no_user_tokens']['5'] );
	}

	/**
	 * Test verify error
	 */
	public function test_verify_error() {
		$error = $this->get_sample_error( 'unknown_user', 3 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->error_handler->verify_error( $stored_errors['unknown_user']['3'] );

		$verified_errors = $this->error_handler->get_verified_errors();

		$this->assertEquals( $verified_errors['unknown_user']['3'], $stored_errors['unknown_user']['3'] );
	}

	/**
	 * Test encryption available.
	 */
	public function test_encryption() {
		$error = $this->get_sample_error( 'unknown_user', 3 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();

		$encrypted = $this->error_handler->encrypt_data_to_wpcom( $stored_errors['unknown_user']['3'] );

		$this->assertIsString( $encrypted );
		$this->assertEquals( 500, strlen( $encrypted ) );
	}

	/**
	 * Test Garbage collector.
	 */
	public function test_garbage_collector() {
		$error  = $this->get_sample_error( 'unknown_user', 3 );
		$error2 = $this->get_sample_error( 'invalid_token', 4 );
		$error3 = $this->get_sample_error( 'no_user_tokens', 5 );
		$error4 = $this->get_sample_error( 'no_user_tokens', 6 );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );
		$this->error_handler->report_error( $error4 );

		// Manipulate the timestamps directly in the database.
		$saved_options = get_option( Error_Handler::STORED_ERRORS_OPTION );
		$this->assertCount( 3, $saved_options );
		$this->assertCount( 1, $saved_options['no_user_tokens'] );
		$saved_options['invalid_token'][4]['timestamp']  = time() - DAY_IN_SECONDS * 4;
		$saved_options['no_user_tokens'][6]['timestamp'] = time() - DAY_IN_SECONDS * 4;
		update_option( Error_Handler::STORED_ERRORS_OPTION, $saved_options );

		$errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 2, $errors );

		$this->assertArrayHasKey( 'unknown_user', $errors );
		$this->assertArrayHasKey( 'no_user_tokens', $errors );
		$this->assertArrayNotHasKey( 'invalid_token', $errors );

		$this->assertCount( 1, $errors['no_user_tokens'] );
	}

	/**
	 * Test `Error_Handler::check_api_response_for_errors()`.
	 */
	public function test_check_api_response_for_errors() {
		$this->error_handler->check_api_response_for_errors(
			array(
				'response' => array(
					'code' => 500,
				),
				'body'     => '{"error":"unknown_token","message":"It looks like your Jetpack connection is broken."}',
			),
			array( 'token' => 'broken:1:0' ),
			'https://localhost/',
			'POST',
			'rest'
		);

		$stored_errors   = $this->error_handler->get_stored_errors();
		$verified_errors = $this->error_handler->get_verified_errors();

		$this->assertCount( 1, $stored_errors );
		$this->assertArrayHasKey( 'unknown_token', $stored_errors );
		$this->assertCount( 1, $stored_errors['unknown_token'] );
		$this->assertArrayHasKey( 0, $stored_errors['unknown_token'] );
		$this->assertArrayHasKey( 'error_code', $stored_errors['unknown_token']['0'] );
		$this->assertArrayHasKey( 'error_type', $stored_errors['unknown_token']['0'] );
		$this->assertEquals( 'rest', $stored_errors['unknown_token']['0']['error_type'] );

		$this->assertCount( 1, $verified_errors );
		$this->assertArrayHasKey( 'unknown_token', $verified_errors );
		$this->assertCount( 1, $verified_errors['unknown_token'] );
		$this->assertArrayHasKey( 0, $verified_errors['unknown_token'] );
		$this->assertArrayHasKey( 'error_code', $verified_errors['unknown_token']['0'] );
		$this->assertEquals( 'rest', $verified_errors['unknown_token']['0']['error_type'] );
	}

	/**
	 * Test storing errors
	 */
	public function test_delete_all_api_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error  = $this->get_sample_error( 'invalid_token', 1, 'xmlrpc' );
		$error2 = $this->get_sample_error( 'unknown_user', 1, 'rest' );
		$error3 = $this->get_sample_error( 'invalid_connection_owner', 'invalid', 'connection' );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );
		$this->error_handler->report_error( $error3 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 3, $stored_errors );

		$this->error_handler->delete_all_api_errors();

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 1, $stored_errors );

		$this->assertArrayNotHasKey( 'invalid_token', $stored_errors );
		$this->assertArrayNotHasKey( 'unknown_user', $stored_errors );
		$this->assertArrayHasKey( 'invalid_connection_owner', $stored_errors );
	}

	/**
	 * Test get_instance singleton
	 */
	public function test_get_instance() {
		$instance1 = Error_Handler::get_instance();
		$instance2 = Error_Handler::get_instance();

		$this->assertInstanceOf( Error_Handler::class, $instance1 );
		$this->assertSame( $instance1, $instance2, 'get_instance should return the same instance (singleton)' );
	}

	/**
	 * Test wp_error_to_array
	 */
	public function test_wp_error_to_array() {
		$error       = $this->get_sample_error( 'invalid_token', 5 );
		$error_array = $this->error_handler->wp_error_to_array( $error );

		$this->assertIsArray( $error_array );
		$this->assertArrayHasKey( 'error_code', $error_array );
		$this->assertArrayHasKey( 'user_id', $error_array );
		$this->assertArrayHasKey( 'error_message', $error_array );
		$this->assertArrayHasKey( 'error_data', $error_array );
		$this->assertArrayHasKey( 'timestamp', $error_array );
		$this->assertArrayHasKey( 'nonce', $error_array );
		$this->assertArrayHasKey( 'error_type', $error_array );

		$this->assertEquals( 'invalid_token', $error_array['error_code'] );
		$this->assertSame( '5', $error_array['user_id'] );
		$this->assertEquals( 'An error was triggered', $error_array['error_message'] );
		$this->assertEquals( 'xmlrpc', $error_array['error_type'] );
	}

	/**
	 * Test wp_error_to_array with invalid error (missing signature_details)
	 */
	public function test_wp_error_to_array_invalid() {
		$error  = new \WP_Error( 'test_error', 'Test message', array() );
		$result = $this->error_handler->wp_error_to_array( $error );

		$this->assertFalse( $result );
	}

	/**
	 * Test delete_all_errors
	 */
	public function test_delete_all_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertCount( 1, $stored_errors );

		// Verify the error
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );
		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertCount( 1, $verified_errors );

		// Delete all errors
		$this->error_handler->delete_all_errors();

		$stored_errors   = $this->error_handler->get_stored_errors();
		$verified_errors = $this->error_handler->get_verified_errors();

		$this->assertEmpty( $stored_errors );
		$this->assertEmpty( $verified_errors );
	}

	/**
	 * Test delete_stored_errors
	 */
	public function test_delete_stored_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertCount( 1, $stored_errors );

		$result = $this->error_handler->delete_stored_errors();
		$this->assertTrue( $result );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertEmpty( $stored_errors );
	}

	/**
	 * Test delete_verified_errors
	 */
	public function test_delete_verified_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertCount( 1, $verified_errors );

		$result = $this->error_handler->delete_verified_errors();
		$this->assertTrue( $result );

		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertEmpty( $verified_errors );
	}

	/**
	 * Test delete_all_errors_and_return_unfiltered_value
	 */
	public function test_delete_all_errors_and_return_unfiltered_value() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertCount( 1, $stored_errors );

		$test_value = 'test_return_value';
		$result     = $this->error_handler->delete_all_errors_and_return_unfiltered_value( $test_value );

		$this->assertEquals( $test_value, $result, 'Should return the input value unchanged' );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertEmpty( $stored_errors, 'Should delete all errors' );
	}

	/**
	 * Test jetpack_react_dashboard_error
	 */
	public function test_jetpack_react_dashboard_error() {
		// Set up a verified error first
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		// Set the error code on the handler
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'invalid_token' );

		$initial_errors = array();
		$result         = $this->error_handler->jetpack_react_dashboard_error( $initial_errors );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertArrayHasKey( 'code', $result[0] );
		$this->assertArrayHasKey( 'message', $result[0] );
		$this->assertArrayHasKey( 'action', $result[0] );
		$this->assertArrayHasKey( 'data', $result[0] );

		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] );
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'invalid_token', $result[0]['data']['api_error_code'] );
	}

	/**
	 * Test jetpack_react_dashboard_error with custom error data (non-protected_owner)
	 */
	public function test_jetpack_react_dashboard_error_with_custom_data() {
		// Mock a verified error with custom action and data (but not protected_owner)
		$custom_error = array(
			'test_error' => array(
				'1' => array(
					'error_code'    => 'test_error',
					'user_id'       => '1',
					'error_message' => 'Custom error message',
					'error_data'    => array(
						'action'      => 'custom_action',
						'support_url' => 'https://example.com/support',
						'custom_data' => 'test_value',
					),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
					'error_type'    => 'custom',
				),
			),
		);

		// Mock the get_verified_errors method to return our custom error
		add_filter(
			'jetpack_connection_get_verified_errors',
			function () use ( $custom_error ) {
				return $custom_error;
			}
		);

		// Set the error code on the handler
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'test_error' );

		$initial_errors = array();
		$result         = $this->error_handler->jetpack_react_dashboard_error( $initial_errors );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		// For non-protected_owner errors, should use default values regardless of custom data
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try reconnecting.', $result[0]['message'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] );

		// Should only have api_error_code, not the custom data
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'test_error', $result[0]['data']['api_error_code'] );
		$this->assertArrayNotHasKey( 'support_url', $result[0]['data'] );
		$this->assertArrayNotHasKey( 'custom_data', $result[0]['data'] );
	}

	/**
	 * Test handle_verified_errors
	 */
	public function test_handle_verified_errors() {
		// Mock verified errors
		$verified_errors = array(
			'invalid_token' => array(
				'1' => array(
					'error_code'    => 'invalid_token',
					'user_id'       => '1',
					'error_message' => 'Invalid token error',
					'error_data'    => array(),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
					'error_type'    => 'xmlrpc',
				),
			),
		);

		add_filter(
			'jetpack_connection_get_verified_errors',
			function () use ( $verified_errors ) {
				return $verified_errors;
			}
		);

		// Use reflection to call the method since it's called during admin_init
		$reflection = new \ReflectionClass( $this->error_handler );
		$method     = $reflection->getMethod( 'handle_verified_errors' );
		$method->setAccessible( true );
		$method->invoke( $this->error_handler );

		// Check that error_code property was set
		$property = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$error_code = $property->getValue( $this->error_handler );

		$this->assertEquals( 'invalid_token', $error_code );
	}

	/**
	 * Test send_error_to_wpcom
	 */
	public function test_send_error_to_wpcom() {
		// Mock Jetpack_Options::get_option
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Jetpack_Options class not available' );
		}

		// Create a sample error array
		$error_array = array(
			'error_code'    => 'test_error',
			'user_id'       => '1',
			'error_message' => 'Test error message',
			'error_data'    => array( 'test' => 'data' ),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		// Mock the blog ID
		add_filter(
			'pre_option_jetpack_options',
			function ( $value, $option ) {
				if ( $option === 'jetpack_options' ) {
					return array( 'id' => 12345 );
				}
				return $value;
			},
			10,
			2
		);

		$result = $this->error_handler->send_error_to_wpcom( $error_array );

		// Should return true if encryption succeeds (which it should with valid data)
		$this->assertTrue( $result );
	}

	/**
	 * Test jetpack_react_dashboard_error with protected_owner error
	 */
	public function test_jetpack_react_dashboard_error_with_protected_owner() {
		// Mock a verified protected_owner error with custom message and action
		$protected_owner_error = array(
			'protected_owner' => array(
				'1' => array(
					'error_code'    => 'protected_owner',
					'user_id'       => '1',
					'error_message' => 'This site has a protected owner. Please contact support.',
					'error_data'    => array(
						'action'      => 'support',
						'support_url' => 'https://jetpack.com/support',
						'owner_id'    => 123,
					),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
					'error_type'    => 'protected_owner',
				),
			),
		);

		// Mock the get_verified_errors method to return our protected_owner error
		add_filter(
			'jetpack_connection_get_verified_errors',
			function () use ( $protected_owner_error ) {
				return $protected_owner_error;
			}
		);

		// Set the error code on the handler to protected_owner
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'protected_owner' );

		$initial_errors = array();
		$result         = $this->error_handler->jetpack_react_dashboard_error( $initial_errors );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		// Verify the error structure
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'This site has a protected owner. Please contact support.', $result[0]['message'] );
		$this->assertEquals( 'support', $result[0]['action'] );

		// Verify the error data includes both api_error_code and custom data
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'protected_owner', $result[0]['data']['api_error_code'] );
		$this->assertArrayHasKey( 'support_url', $result[0]['data'] );
		$this->assertEquals( 'https://jetpack.com/support', $result[0]['data']['support_url'] );
		$this->assertArrayHasKey( 'owner_id', $result[0]['data'] );
		$this->assertEquals( 123, $result[0]['data']['owner_id'] );
	}

	/**
	 * Test jetpack_react_dashboard_error with protected_owner error but no custom data
	 */
	public function test_jetpack_react_dashboard_error_with_protected_owner_no_custom_data() {
		// Mock a verified protected_owner error without custom message or action
		$protected_owner_error = array(
			'protected_owner' => array(
				'1' => array(
					'error_code'    => 'protected_owner',
					'user_id'       => '1',
					'error_message' => '',
					'error_data'    => array(),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
					'error_type'    => 'protected_owner',
				),
			),
		);

		// Mock the get_verified_errors method to return our protected_owner error
		add_filter(
			'jetpack_connection_get_verified_errors',
			function () use ( $protected_owner_error ) {
				return $protected_owner_error;
			}
		);

		// Set the error code on the handler to protected_owner
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'protected_owner' );

		$initial_errors = array();
		$result         = $this->error_handler->jetpack_react_dashboard_error( $initial_errors );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		// Should use default values when custom data is not available
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try reconnecting.', $result[0]['message'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] );

		// Should still have api_error_code
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'protected_owner', $result[0]['data']['api_error_code'] );
	}

	/**
	 * Test jetpack_react_dashboard_error with protected_owner error but no verified errors
	 */
	public function test_jetpack_react_dashboard_error_with_protected_owner_no_verified_errors() {
		// Mock empty verified errors
		add_filter(
			'jetpack_connection_get_verified_errors',
			function () {
				return array();
			}
		);

		// Set the error code on the handler to protected_owner
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'protected_owner' );

		$initial_errors = array();
		$result         = $this->error_handler->jetpack_react_dashboard_error( $initial_errors );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		// Should use default values when no verified errors exist
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'Your connection with WordPress.com seems to be broken. If you\'re experiencing issues, please try reconnecting.', $result[0]['message'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] );

		// Should still have api_error_code
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'protected_owner', $result[0]['data']['api_error_code'] );
	}
}
