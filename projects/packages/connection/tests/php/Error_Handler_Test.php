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
	 * Test get_instance singleton pattern
	 */
	public function test_get_instance() {
		$instance1 = Error_Handler::get_instance();
		$instance2 = Error_Handler::get_instance();

		$this->assertInstanceOf( Error_Handler::class, $instance1 );
		$this->assertSame( $instance1, $instance2, 'get_instance should return the same instance (singleton pattern)' );
	}

	/**
	 * Test wp_error_to_array method
	 */
	public function test_wp_error_to_array() {
		$error       = $this->get_sample_error( 'invalid_token', 5, 'rest' );
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
		$this->assertEquals( 'rest', $error_array['error_type'] );
		$this->assertIsArray( $error_array['error_data'] );
		$this->assertIsInt( $error_array['timestamp'] );
		$this->assertIsString( $error_array['nonce'] );
	}

	/**
	 * Test wp_error_to_array with invalid error (missing signature_details)
	 */
	public function test_wp_error_to_array_invalid_error() {
		$error  = new \WP_Error( 'test_error', 'Test message', array() );
		$result = $this->error_handler->wp_error_to_array( $error );

		$this->assertFalse( $result );
	}

	/**
	 * Test wp_error_to_array with invalid error (missing token)
	 */
	public function test_wp_error_to_array_missing_token() {
		$error  = new \WP_Error(
			'test_error',
			'Test message',
			array(
				'signature_details' => array(
					'timestamp' => time(),
					'nonce'     => 'test_nonce',
				),
			)
		);
		$result = $this->error_handler->wp_error_to_array( $error );

		$this->assertFalse( $result );
	}

	/**
	 * Test delete_all_errors method
	 */
	public function test_delete_all_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Add some errors
		$error1 = $this->get_sample_error( 'invalid_token', 1 );
		$error2 = $this->get_sample_error( 'unknown_user', 2 );

		$this->error_handler->report_error( $error1 );
		$this->error_handler->report_error( $error2 );

		// Verify errors and verify them
		$stored_errors = $this->error_handler->get_stored_errors();
		foreach ( $stored_errors as $users ) {
			foreach ( $users as $error ) {
				$this->error_handler->verify_error( $error );
			}
		}

		// Ensure we have both stored and verified errors
		$this->assertNotEmpty( $this->error_handler->get_stored_errors() );
		$this->assertNotEmpty( $this->error_handler->get_verified_errors() );

		// Delete all errors
		$this->error_handler->delete_all_errors();

		// Verify both stored and verified errors are deleted
		$this->assertEmpty( $this->error_handler->get_stored_errors() );
		$this->assertEmpty( $this->error_handler->get_verified_errors() );
	}

	/**
	 * Test delete_stored_errors method
	 */
	public function test_delete_stored_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$this->assertNotEmpty( $this->error_handler->get_stored_errors() );

		$result = $this->error_handler->delete_stored_errors();

		$this->assertTrue( $result );
		$this->assertEmpty( $this->error_handler->get_stored_errors() );
	}

	/**
	 * Test delete_verified_errors method
	 */
	public function test_delete_verified_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		$this->assertNotEmpty( $this->error_handler->get_verified_errors() );

		$result = $this->error_handler->delete_verified_errors();

		$this->assertTrue( $result );
		$this->assertEmpty( $this->error_handler->get_verified_errors() );
	}

	/**
	 * Test delete_all_errors_and_return_unfiltered_value method
	 */
	public function test_delete_all_errors_and_return_unfiltered_value() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Add some errors
		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		$this->assertNotEmpty( $this->error_handler->get_stored_errors() );
		$this->assertNotEmpty( $this->error_handler->get_verified_errors() );

		$test_value = 'test_return_value';
		$result     = $this->error_handler->delete_all_errors_and_return_unfiltered_value( $test_value );

		// Should return the original value
		$this->assertEquals( $test_value, $result );

		// Should delete all errors
		$this->assertEmpty( $this->error_handler->get_stored_errors() );
		$this->assertEmpty( $this->error_handler->get_verified_errors() );
	}

	/**
	 * Test send_error_to_wpcom method
	 */
	public function test_send_error_to_wpcom() {
		// Mock Jetpack_Options::get_option
		add_filter(
			'pre_option_jetpack_options',
			function ( $pre_option, $option ) {
				if ( 'jetpack_options' === $option ) {
					return array( 'id' => 12345 );
				}
				return $pre_option;
			},
			10,
			3
		);

		$error_array = array(
			'error_code'    => 'test_error',
			'user_id'       => '1',
			'error_message' => 'Test error message',
			'error_data'    => array( 'test' => 'data' ),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'rest',
		);

		// Mock wp_remote_post to avoid actual HTTP requests
		add_filter(
			'pre_http_request',
			function ( $preempt, $_parsed_args, $url ) {
				if ( strpos( $url, 'public-api.wordpress.com' ) !== false ) {
					return array(
						'response' => array( 'code' => 200 ),
						'body'     => '{"success": true}',
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$result = $this->error_handler->send_error_to_wpcom( $error_array );

		$this->assertTrue( $result );
	}

	/**
	 * Test send_error_to_wpcom with encryption failure
	 */
	public function test_send_error_to_wpcom_encryption_failure() {
		// Mock encryption to fail
		$error_handler_mock = $this->getMockBuilder( Error_Handler::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'encrypt_data_to_wpcom' ) )
			->getMock();

		$error_handler_mock->method( 'encrypt_data_to_wpcom' )
			->willReturn( false );

		$error_array = array(
			'error_code' => 'test_error',
			'user_id'    => '1',
		);

		$result = $error_handler_mock->send_error_to_wpcom( $error_array );

		$this->assertFalse( $result );
	}

	/**
	 * Test handle_verified_errors method
	 */
	public function test_handle_verified_errors() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Add an error that should trigger admin notices
		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		$this->error_handler->handle_verified_errors();

		// Verify that admin_notices and react_connection_errors_initial_state actions were added
		// has_action returns the priority (not boolean true) when the action exists, false when it doesn't
		$this->assertNotFalse( has_action( 'admin_notices', array( $this->error_handler, 'generic_admin_notice_error' ) ) );
		$this->assertNotFalse( has_action( 'react_connection_errors_initial_state', array( $this->error_handler, 'jetpack_react_dashboard_error' ) ) );
	}

	/**
	 * Test jetpack_react_dashboard_error method with default error
	 */
	public function test_jetpack_react_dashboard_error_default() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$this->error_handler->verify_error( $stored_errors['invalid_token']['1'] );

		// Set the error_code property
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'invalid_token' );

		$errors = array();
		$result = $this->error_handler->jetpack_react_dashboard_error( $errors );

		$this->assertCount( 1, $result );
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] );
		$this->assertStringContainsString( 'broken', $result[0]['message'] );
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertEquals( 'invalid_token', $result[0]['data']['api_error_code'] );
	}

	/**
	 * Test jetpack_react_dashboard_error method with protected_owner error
	 */
	public function test_jetpack_react_dashboard_error_protected_owner() {
		// Create a protected_owner error manually
		$protected_owner_error = array(
			'error_code'    => 'protected_owner_missing',
			'user_id'       => '1',
			'error_message' => 'Custom protected owner message',
			'error_data'    => array(
				'action' => 'custom_action',
				'custom' => 'data',
			),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'protected_owner',
		);

		// Manually add to verified errors
		$verified_errors = array(
			'protected_owner_missing' => array(
				'1' => $protected_owner_error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Set the error_code property
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'protected_owner_missing' );

		$errors = array();
		$result = $this->error_handler->jetpack_react_dashboard_error( $errors );

		$this->assertCount( 1, $result );
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'custom_action', $result[0]['action'] );
		$this->assertEquals( 'Custom protected owner message', $result[0]['message'] );
		$this->assertArrayHasKey( 'api_error_code', $result[0]['data'] );
		$this->assertArrayHasKey( 'custom', $result[0]['data'] );
		$this->assertEquals( 'data', $result[0]['data']['custom'] );
	}

	/**
	 * Test jetpack_react_dashboard_error method with non-protected_owner error_type
	 */
	public function test_jetpack_react_dashboard_error_non_protected_owner() {
		// Create an error with different error_type
		$regular_error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Custom message that should not be used',
			'error_data'    => array(
				'action' => 'custom_action_ignored',
			),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		// Manually add to verified errors
		$verified_errors = array(
			'invalid_token' => array(
				'1' => $regular_error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Set the error_code property
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'error_code' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, 'invalid_token' );

		$errors = array();
		$result = $this->error_handler->jetpack_react_dashboard_error( $errors );

		$this->assertCount( 1, $result );
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] ); // Should use default
		$this->assertStringContainsString( 'broken', $result[0]['message'] ); // Should use default message
	}

	/**
	 * Test verify_xml_rpc_error method with valid nonce
	 */
	public function test_verify_xml_rpc_error_valid_nonce() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error = $this->get_sample_error( 'invalid_token', 1 );
		$this->error_handler->report_error( $error );

		$stored_errors = $this->error_handler->get_stored_errors();
		$nonce         = $stored_errors['invalid_token']['1']['nonce'];

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/verify_xmlrpc_error' );
		$request->set_param( 'nonce', $nonce );

		$response = $this->error_handler->verify_xml_rpc_error( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data() );

		// Verify the error was added to verified errors
		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertArrayHasKey( 'invalid_token', $verified_errors );
	}

	/**
	 * Test verify_xml_rpc_error method with invalid nonce
	 */
	public function test_verify_xml_rpc_error_invalid_nonce() {
		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/verify_xmlrpc_error' );
		$request->set_param( 'nonce', 'invalid_nonce' );

		$response = $this->error_handler->verify_xml_rpc_error( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertFalse( $response->get_data() );
	}

	/**
	 * Test generic_admin_notice_error method on jetpack dashboard page
	 */
	public function test_generic_admin_notice_error_jetpack_page() {
		global $pagenow;
		$original_pagenow = $pagenow;
		$pagenow          = 'admin.php';
		$_GET['page']     = 'jetpack';

		// Mock current_user_can to return true
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_connect' );

		add_filter(
			'jetpack_connection_error_notice_message',
			function () {
				return 'Should not be displayed';
			},
			10,
			2
		);

		ob_start();
		$this->error_handler->generic_admin_notice_error();
		$output = ob_get_clean();

		$this->assertEmpty( $output, 'Should not display notice on jetpack dashboard page' );

		// Restore globals
		$pagenow = $original_pagenow;
		unset( $_GET['page'] );
	}

	/**
	 * Test generic_admin_notice_error method without jetpack_connect capability
	 */
	public function test_generic_admin_notice_error_no_capability() {
		// Ensure user doesn't have jetpack_connect capability
		$user = wp_get_current_user();
		$user->remove_cap( 'jetpack_connect' );

		add_filter(
			'jetpack_connection_error_notice_message',
			function () {
				return 'Should not be displayed';
			},
			10,
			2
		);

		ob_start();
		$this->error_handler->generic_admin_notice_error();
		$output = ob_get_clean();

		$this->assertEmpty( $output, 'Should not display notice without jetpack_connect capability' );
	}

	/**
	 * Test get_verified_errors filter
	 */
	public function test_get_verified_errors_filter() {
		// Add a verified error
		$error = array(
			'error_code'    => 'test_error',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'test',
		);

		$verified_errors = array(
			'test_error' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Add filter to inject additional errors
		add_filter(
			'jetpack_connection_get_verified_errors',
			function ( $errors ) {
				$errors['injected_error'] = array(
					'1' => array(
						'error_code'    => 'injected_error',
						'user_id'       => '1',
						'error_message' => 'Injected error',
						'error_data'    => array(),
						'timestamp'     => time(),
						'nonce'         => 'injected_nonce',
						'error_type'    => 'injected',
					),
				);
				return $errors;
			}
		);

		$result = $this->error_handler->get_verified_errors();

		$this->assertCount( 2, $result );
		$this->assertArrayHasKey( 'test_error', $result );
		$this->assertArrayHasKey( 'injected_error', $result );
	}
}
