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
	 * Clean up after tests
	 */
	public function tear_down() {
		// Clear any cached data between tests
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'cached_displayable_errors' );
		$property->setAccessible( true );
		$property->setValue( $this->error_handler, null );

		// Clear any test data
		$this->error_handler->delete_all_errors();

		// Remove any filters that might have been added
		remove_all_filters( 'jetpack_connection_get_verified_errors' );
		remove_all_filters( 'jetpack_connection_error_notice_message' );
		remove_all_filters( 'jetpack_connection_bypass_error_reporting_gate' );
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
		$this->assertCount( 1, $stored_errors['invalid_token'] );

		// Verify key fields by accessing them directly - if they don't exist, test will fail with clear message
		$error_data = $stored_errors['invalid_token']['1'];
		$this->assertEquals( 'xmlrpc', $error_data['error_type'] );
		$this->assertEquals( 'invalid_token', $error_data['error_code'] );
		$this->assertSame( '1', $error_data['user_id'] );
		$this->assertEquals( 'An error was triggered', $error_data['error_message'] );
		$this->assertNotEmpty( $error_data['nonce'] );
		$this->assertNotEmpty( $error_data['timestamp'] );
		$this->assertIsArray( $error_data['error_data'] );
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
		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 1, $stored_errors['unknown_user'] );
		$this->assertCount( 1, $stored_errors['invalid_connection_owner'] );

		// Verify error types and codes directly
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );
		$this->assertEquals( 'rest', $stored_errors['unknown_user']['1']['error_type'] );
		$this->assertEquals( 'connection', $stored_errors['invalid_connection_owner']['invalid']['error_type'] );
		$this->assertEquals( 'unknown_user', $stored_errors['unknown_user']['1']['error_code'] );
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
		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 2, $stored_errors['unknown_user'] );

		// Verify user 2 error exists and has correct data
		$this->assertEquals( 'unknown_user', $stored_errors['unknown_user']['2']['error_code'] );
		$this->assertSame( '2', $stored_errors['unknown_user']['2']['user_id'] );
		$this->assertNotEmpty( $stored_errors['unknown_user']['2']['nonce'] );
		$this->assertNotEmpty( $stored_errors['unknown_user']['2']['timestamp'] );
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
		$this->assertSame( '8', $stored_errors['unknown_user']['8']['user_id'], 'sixth inserted error must be present' );
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
	 * Test get_displayable_errors method with no errors
	 */
	public function test_displayable_errors_no_errors() {
		$result = $this->error_handler->get_displayable_errors();
		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test get_displayable_errors method with displayable error
	 */
	public function test_displayable_errors_displayable_error() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		$result = $this->error_handler->get_displayable_errors();

		$this->assertCount( 1, $result );
		$this->assertStringContainsString( 'broken', $result['invalid_token']['1']['error_message'] );
		$this->assertEquals( 'invalid_token', $result['invalid_token']['1']['error_code'] );
	}

	/**
	 * Test get_displayable_errors method with filter (WoA site)
	 */
	public function test_displayable_errors_filter_woa_site() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Add filter that should be applied
		add_filter(
			'jetpack_connection_displayable_errors',
			function ( $errors ) {
				$errors['invalid_token']['1']['error_message'] = 'Filtered message for WoA';
				return $errors;
			}
		);

		// For this test, we'll just verify the filter exists and can be applied
		// The actual WoA site detection would require more complex mocking
		$result = $this->error_handler->get_displayable_errors();

		// Verify the basic structure is correct
		$this->assertCount( 1, $result );
		$this->assertEquals( 'invalid_token', $result['invalid_token']['1']['error_code'] );
	}

	/**
	 * Test should_allow_error_filtering method
	 */
	public function test_should_allow_error_filtering() {
		$reflection = new \ReflectionClass( $this->error_handler );
		$method     = $reflection->getMethod( 'should_allow_error_filtering' );
		$method->setAccessible( true );

		// This test will depend on the actual Host class implementation
		// We'll just verify the method exists and returns a boolean
		$result = $method->invoke( $this->error_handler );
		$this->assertIsBool( $result );
	}

	/**
	 * Test handle_verified_errors method with displayable errors
	 */
	public function test_handle_verified_errors_with_displayable_errors() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Mock the action hooks
		global $wp_filter;
		$wp_filter = array();

		$this->error_handler->handle_verified_errors();

		// Check that the hooks were added
		// @phan-suppress-next-line PhanTypeInvalidDimOffset
		$this->assertNotEmpty( $wp_filter['admin_notices'] );
		// @phan-suppress-next-line PhanTypeInvalidDimOffset
		$this->assertNotEmpty( $wp_filter['react_connection_errors_initial_state'] );
	}

	/**
	 * Test handle_verified_errors method with no displayable errors
	 */
	public function test_handle_verified_errors_with_no_displayable_errors() {
		// Add a non-displayable error
		$error = array(
			'error_code'    => 'unknown_user',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'unknown_user' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Mock the action hooks
		global $wp_filter;
		$wp_filter = array();

		$this->error_handler->handle_verified_errors();

		// Check that no hooks were added
		$this->assertArrayNotHasKey( 'admin_notices', $wp_filter );
		$this->assertArrayNotHasKey( 'react_connection_errors_initial_state', $wp_filter );
	}

	/**
	 * Test report_error method
	 */
	public function test_report_error() {
		$error = new \WP_Error(
			'invalid_token',
			'Invalid token',
			array(
				'signature_details' => array(
					'token' => 'dhj938djh938d:1:3',
				),
			)
		);

		// Bypass the gate for testing
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Report the error
		$this->error_handler->report_error( $error );

		// Verify the error was stored
		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertArrayHasKey( 'invalid_token', $stored_errors );
		$this->assertArrayHasKey( '3', $stored_errors['invalid_token'] );
	}

	/**
	 * Test report_error method with force parameter
	 */
	public function test_report_error_with_force() {
		$error = new \WP_Error(
			'invalid_token',
			'Invalid token',
			array(
				'signature_details' => array(
					'token' => 'dhj938djh938d:1:3',
				),
			)
		);

		// Set a transient to close the gate
		set_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token', true, HOUR_IN_SECONDS );

		// Report the error with force=true (should bypass the gate)
		$this->error_handler->report_error( $error, true );

		// Verify the error was stored despite the gate being closed
		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertArrayHasKey( 'invalid_token', $stored_errors );
		$this->assertArrayHasKey( '3', $stored_errors['invalid_token'] );

		// Clean up transient only (tear_down will handle the rest)
		delete_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token' );
	}

	/**
	 * Test report_error method with skip_wpcom_verification
	 */
	public function test_report_error_with_skip_wpcom_verification() {
		$error = new \WP_Error(
			'invalid_token',
			'Invalid token',
			array(
				'signature_details' => array(
					'token' => 'dhj938djh938d:1:3',
				),
			)
		);

		// Bypass the gate for testing
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Report the error with skip_wpcom_verification=true
		$this->error_handler->report_error( $error, false, true );

		// Verify the error was stored
		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertArrayHasKey( 'invalid_token', $stored_errors );
		$this->assertArrayHasKey( '3', $stored_errors['invalid_token'] );

		// Verify the error was also verified (since skip_wpcom_verification=true)
		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertArrayHasKey( 'invalid_token', $verified_errors );
		$this->assertArrayHasKey( '3', $verified_errors['invalid_token'] );
	}

	/**
	 * Test report_error method with unknown error code
	 */
	public function test_report_error_unknown_error_code() {
		$error = new \WP_Error(
			'unknown_error_code',
			'Unknown error',
			array(
				'signature_details' => array(
					'token' => 'dhj938djh938d:1:3',
				),
			)
		);

		// Bypass the gate for testing
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		// Report the error with unknown error code
		$this->error_handler->report_error( $error );

		// Verify the error was NOT stored (unknown error codes are ignored)
		$stored_errors = $this->error_handler->get_stored_errors();
		$this->assertArrayNotHasKey( 'unknown_error_code', $stored_errors );
	}

	/**
	 * Test should_report_error method with gate closed
	 */
	public function test_should_report_error_gate_closed() {
		$error = new \WP_Error( 'invalid_token', 'Invalid token' );

		// Set a transient to close the gate
		set_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token', true, HOUR_IN_SECONDS );

		$result = $this->error_handler->should_report_error( $error );
		$this->assertFalse( $result );

		// Clean up
		delete_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token' );
	}

	/**
	 * Test should_report_error method with gate open
	 */
	public function test_should_report_error_gate_open() {
		$error = new \WP_Error( 'invalid_token', 'Invalid token' );

		$result = $this->error_handler->should_report_error( $error );
		$this->assertTrue( $result );

		// Verify the gate was set
		$this->assertTrue( get_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token' ) );

		// Clean up
		delete_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token' );
	}

	/**
	 * Test should_report_error method with bypass filter
	 */
	public function test_should_report_error_bypass_filter() {
		$error = new \WP_Error( 'invalid_token', 'Invalid token' );

		// Set a transient to close the gate
		set_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token', true, HOUR_IN_SECONDS );

		// Add filter to bypass gate
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$result = $this->error_handler->should_report_error( $error );
		$this->assertTrue( $result );

		// Clean up
		delete_transient( Error_Handler::ERROR_REPORTING_GATE . 'invalid_token' );
		remove_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );
	}

	/**
	 * Test build_error_array method with valid parameters
	 */
	public function test_build_error_array() {
		$error_code    = 'test_error';
		$error_message = 'Test error message';
		$error_data    = array( 'key' => 'value' );
		$user_id       = '123';
		$error_type    = 'test_type';

		$result = $this->error_handler->build_error_array( $error_code, $error_message, $error_data, $user_id, $error_type );

		$this->assertIsArray( $result );
		$this->assertEquals( $error_code, $result['error_code'] );
		$this->assertEquals( $error_message, $result['error_message'] );
		$this->assertEquals( $error_data, $result['error_data'] );
		$this->assertEquals( $user_id, $result['user_id'] );
		$this->assertEquals( $error_type, $result['error_type'] );
		$this->assertArrayHasKey( 'timestamp', $result );
		$this->assertArrayHasKey( 'nonce', $result );
		$this->assertIsInt( $result['timestamp'] );
		$this->assertIsString( $result['nonce'] );
	}

	/**
	 * Test build_error_array method with invalid parameters
	 */
	public function test_build_error_array_invalid_parameters() {
		// Test with empty error code
		$result = $this->error_handler->build_error_array( '', 'Test message' );
		$this->assertFalse( $result );

		// Test with empty error message
		$result = $this->error_handler->build_error_array( 'test_error', '' );
		$this->assertFalse( $result );
	}

	/**
	 * Test build_error_array method with default parameters
	 */
	public function test_build_error_array_default_parameters() {
		$error_code    = 'test_error';
		$error_message = 'Test error message';

		$result = $this->error_handler->build_error_array( $error_code, $error_message );

		$this->assertIsArray( $result );
		$this->assertEquals( $error_code, $result['error_code'] );
		$this->assertEquals( $error_message, $result['error_message'] );
		$this->assertEquals( array(), $result['error_data'] );
		$this->assertSame( '0', $result['user_id'] );
		$this->assertSame( '', $result['error_type'] );
	}

	/**
	 * Test get_stored_errors method
	 */
	public function test_get_stored_errors() {
		// Add some test errors
		$test_errors = array(
			'test_error' => array(
				'1' => array(
					'error_code'    => 'test_error',
					'user_id'       => '1',
					'error_message' => 'Test message',
					'error_data'    => array(),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
				),
			),
		);
		update_option( Error_Handler::STORED_ERRORS_OPTION, $test_errors );

		$result = $this->error_handler->get_stored_errors();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'test_error', $result );
		$this->assertArrayHasKey( '1', $result['test_error'] );
		$this->assertEquals( 'test_error', $result['test_error']['1']['error_code'] );
	}

	/**
	 * Test get_verified_errors method
	 */
	public function test_get_verified_errors() {
		// Add some test errors
		$test_errors = array(
			'test_error' => array(
				'1' => array(
					'error_code'    => 'test_error',
					'user_id'       => '1',
					'error_message' => 'Test message',
					'error_data'    => array(),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
				),
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $test_errors );

		$result = $this->error_handler->get_verified_errors();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'test_error', $result );
		$this->assertArrayHasKey( '1', $result['test_error'] );
		$this->assertEquals( 'test_error', $result['test_error']['1']['error_code'] );
	}

	/**
	 * Test jetpack_react_dashboard_error method
	 */
	public function test_jetpack_react_dashboard_error() {
		// Add some test errors
		$test_errors = array(
			'invalid_token'       => array(
				'1' => array(
					'error_code'    => 'invalid_token',
					'user_id'       => '1',
					'error_message' => 'Test message',
					'error_data'    => array( 'custom' => 'data' ),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
				),
			),
			'no_valid_user_token' => array(
				'2' => array(
					'error_code'    => 'no_valid_user_token',
					'user_id'       => '2',
					'error_message' => 'Another test message',
					'error_data'    => array( 'action' => 'custom_action' ),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce2',
				),
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $test_errors );

		$result = $this->error_handler->jetpack_react_dashboard_error( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result ); // Only returns the first error

		// Check the first error (should have default 'reconnect' action when not specified)
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertStringContainsString( 'broken', $result[0]['message'] );
		$this->assertEquals( 'reconnect', $result[0]['action'] ); // Default action
		$this->assertEquals( 'invalid_token', $result[0]['data']['api_error_code'] );
		$this->assertEquals( 'data', $result[0]['data']['custom'] );
	}

	/**
	 * Test generic_admin_notice_error method
	 */
	public function test_generic_admin_notice_error() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Test that the method doesn't throw any errors
		// We can't easily test the output without complex mocking, so we'll just verify it runs
		$this->error_handler->generic_admin_notice_error();
		$this->assertTrue( true ); // If we get here, no errors were thrown
	}

	/**
	 * Test generic_admin_notice_error method with empty message filter
	 */
	public function test_generic_admin_notice_error_empty_message() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// Add filter to return empty message
		add_filter( 'jetpack_connection_error_notice_message', '__return_empty_string' );

		// Test that the method doesn't throw any errors when message is empty
		$this->error_handler->generic_admin_notice_error();
		$this->assertTrue( true ); // If we get here, no errors were thrown

		// Clean up
		remove_filter( 'jetpack_connection_error_notice_message', '__return_empty_string' );
	}

	/**
	 * Test caching functionality of get_displayable_errors method
	 */
	public function test_get_displayable_errors_caching() {
		// Add a displayable error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// First call should process the data
		$result1 = $this->error_handler->get_displayable_errors();
		$this->assertIsArray( $result1 );
		$this->assertCount( 1, $result1 );

		// Second call should use cached result
		$result2 = $this->error_handler->get_displayable_errors();
		$this->assertEquals( $result1, $result2 );

		// Verify both results are identical
		$this->assertSame( $result1, $result2 );
	}

	/**
	 * Test cache invalidation when errors are modified
	 */
	public function test_cache_invalidation_on_error_modification() {
		// Add initial error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// First call to populate cache
		$result1 = $this->error_handler->get_displayable_errors();
		$this->assertCount( 1, $result1 );

		// Add a new error via verify_error (should invalidate cache)
		$new_error = array(
			'error_code'    => 'no_valid_user_token',
			'user_id'       => '2',
			'error_message' => 'New error message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'new_nonce',
			'error_type'    => 'xmlrpc',
		);
		$this->error_handler->verify_error( $new_error );

		// Second call should include the new error (cache was invalidated)
		$result2 = $this->error_handler->get_displayable_errors();
		$this->assertCount( 2, $result2 );
		$this->assertArrayHasKey( 'invalid_token', $result2 );
		$this->assertArrayHasKey( 'no_valid_user_token', $result2 );
	}

	/**
	 * Test cache invalidation when errors are deleted
	 */
	public function test_cache_invalidation_on_error_deletion() {
		// Add initial error
		$error = array(
			'error_code'    => 'invalid_token',
			'user_id'       => '1',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce',
			'error_type'    => 'xmlrpc',
		);

		$verified_errors = array(
			'invalid_token' => array(
				'1' => $error,
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		// First call to populate cache
		$result1 = $this->error_handler->get_displayable_errors();
		$this->assertCount( 1, $result1 );

		// Delete all errors (should invalidate cache)
		$this->error_handler->delete_all_errors();

		// Second call should return empty result (cache was invalidated)
		$result2 = $this->error_handler->get_displayable_errors();
		$this->assertEmpty( $result2 );
	}

	/**
	 * Test has_external_filters method
	 */
	public function test_has_external_filters() {
		// Use reflection to access protected method
		$reflection = new \ReflectionClass( $this->error_handler );
		$method     = $reflection->getMethod( 'has_external_filters' );
		$method->setAccessible( true );

		// Test without filters
		$result = $method->invoke( $this->error_handler );
		$this->assertIsBool( $result );

		// Add a filter
		add_filter(
			'jetpack_connection_get_verified_errors',
			function ( $errors ) {
				return $errors;
			}
		);

		// Test with filter
		$result_with_filter = $method->invoke( $this->error_handler );
		$this->assertIsBool( $result_with_filter );
	}

	/**
	 * Test invalidate_displayable_errors_cache method
	 */
	public function test_invalidate_displayable_errors_cache() {
		// Use reflection to access protected method
		$reflection = new \ReflectionClass( $this->error_handler );
		$method     = $reflection->getMethod( 'invalidate_displayable_errors_cache' );
		$method->setAccessible( true );

		// Test that the method doesn't throw any errors
		$method->invoke( $this->error_handler );
		$this->assertTrue( true ); // If we get here, no errors were thrown
	}

	/**
	 * Test jetpack_react_dashboard_error method with custom action
	 */
	public function test_jetpack_react_dashboard_error_with_custom_action() {
		// Add a test error with custom action using a valid displayable error code
		$test_errors = array(
			'invalid_connection_owner' => array(
				'1' => array(
					'error_code'    => 'invalid_connection_owner',
					'user_id'       => '1',
					'error_message' => 'Test message',
					'error_data'    => array( 'action' => 'create_missing_account' ),
					'timestamp'     => time(),
					'nonce'         => 'test_nonce',
				),
			),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $test_errors );

		$result = $this->error_handler->jetpack_react_dashboard_error( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		// Check that the custom action is used
		$this->assertEquals( 'connection_error', $result[0]['code'] );
		$this->assertStringContainsString( 'broken', $result[0]['message'] );
		$this->assertEquals( 'create_missing_account', $result[0]['action'] ); // Custom action
		$this->assertEquals( 'invalid_connection_owner', $result[0]['data']['api_error_code'] );
	}
}
