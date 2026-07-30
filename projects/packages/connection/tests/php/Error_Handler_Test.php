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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $this->error_handler, null );

		// Clear any test data
		$this->error_handler->delete_all_errors();

		// Remove any filters that might have been added
		remove_all_filters( 'jetpack_connection_get_verified_errors' );
		remove_all_filters( 'jetpack_connection_error_notice_message' );
		remove_all_filters( 'jetpack_connection_bypass_error_reporting_gate' );
		remove_all_filters( 'jetpack_connection_ownership_transferable' );

		// Reset viewer/owner state used by the audience-aware display tests.
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( 'master_user' );
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

		// Verify essential fields
		$error_data = $stored_errors['invalid_token']['1'];
		$this->assertEquals( 'invalid_token', $error_data['error_code'] );
		$this->assertEquals( 'xmlrpc', $error_data['error_type'] );
		$this->assertArrayHasKey( 'nonce', $error_data );
		$this->assertArrayHasKey( 'timestamp', $error_data );
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
		$this->assertArrayHasKey( 'unknown_user', $stored_errors );
		$this->assertArrayHasKey( 'invalid_connection_owner', $stored_errors );

		// Verify error types are preserved
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );
		$this->assertEquals( 'rest', $stored_errors['unknown_user']['1']['error_type'] );
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

		// Verify user 2 error exists
		$this->assertEquals( 'unknown_user', $stored_errors['unknown_user']['2']['error_code'] );
		$this->assertSame( '2', $stored_errors['unknown_user']['2']['user_id'] );
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
	 * Test wp_error_to_array user attribution precedence: the token identifies the failed
	 * credential and always wins; an explicit user_id in the error data is only used as a
	 * fallback when the token yields no user (e.g. non-signature errors reported with an
	 * empty token, such as invalid_connection_owner).
	 */
	public function test_wp_error_to_array_user_id_fallback() {
		// Empty token + explicit user_id: the fallback applies.
		$error  = new \WP_Error(
			'invalid_connection_owner',
			'Invalid connection owner',
			array(
				'user_id'           => 42,
				'has_user_token'    => false,
				'error_type'        => 'connection',
				'signature_details' => array( 'token' => '' ),
			)
		);
		$result = $this->error_handler->wp_error_to_array( $error );
		$this->assertSame( '42', $result['user_id'] );
		$this->assertFalse( $result['error_data']['has_user_token'], 'has_user_token from the WP_Error data is preserved into the stored error_data.' );

		// Parseable token + conflicting explicit user_id: the token wins.
		$error  = new \WP_Error(
			'invalid_token',
			'An error was triggered',
			array(
				'user_id'           => 42,
				'error_type'        => 'xmlrpc',
				'signature_details' => array( 'token' => 'dhj938djh938d:1:7' ),
			)
		);
		$result = $this->error_handler->wp_error_to_array( $error );
		$this->assertSame( '7', $result['user_id'] );
		$this->assertArrayNotHasKey( 'has_user_token', $result['error_data'], 'has_user_token is only stored when the reporter provided it.' );

		// Unparseable token + no explicit user_id: stays unattributable.
		$error  = new \WP_Error(
			'malformed_token',
			'Malformed token in request',
			array(
				'error_type'        => 'xmlrpc',
				'signature_details' => array( 'token' => 'garbage' ),
			)
		);
		$result = $this->error_handler->wp_error_to_array( $error );
		$this->assertSame( 'invalid', $result['user_id'] );
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
		// Anonymous class to disable constructor and replace one method.
		// PHPUnit 12.5 whines about mocks without expectations, while getStubBuilder() doesn't exist until 12.5.
		$error_handler_mock = new class() extends Error_Handler {
			public function __construct() {
			}
			public function encrypt_data_to_wpcom( $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		};

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		$this->assertEquals( $user_id, $result['user_id'] );
		$this->assertArrayHasKey( 'timestamp', $result );
		$this->assertArrayHasKey( 'nonce', $result );
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
		$this->assertSame( '0', $result['user_id'] );
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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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

	/**
	 * Test that jetpack_react_dashboard_error() exposes a site-scoped audience.
	 *
	 * The audience is a top-level field on the displayable error, so it must be
	 * threaded through the reshape rather than being dropped with the other
	 * non-error_data fields. A blog-token error (user_id 0) is site-scoped.
	 */
	public function test_jetpack_react_dashboard_error_includes_site_audience() {
		$this->store_single_verified_error( 'invalid_token', '0' );

		$result = $this->error_handler->jetpack_react_dashboard_error( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertArrayHasKey( 'audience', $result[0]['data'], 'The dashboard error data must expose the audience.' );
		$this->assertSame( 'site', $result[0]['data']['audience'], 'A blog-token (user_id 0) error is site-scoped.' );
	}

	/**
	 * Test that jetpack_react_dashboard_error() exposes an owner-scoped audience:
	 * an error stored under the connection owner's (master_user) ID.
	 */
	public function test_jetpack_react_dashboard_error_includes_owner_audience() {
		$owner_id = wp_insert_user(
			array(
				'user_login' => 'dashboard_owner',
				'user_pass'  => 'password',
				'user_email' => 'dashboard_owner@example.org',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $owner_id );
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		$this->store_single_verified_error( 'no_valid_user_token', (string) $owner_id );

		$result = $this->error_handler->jetpack_react_dashboard_error( array() );

		$this->assertCount( 1, $result );
		$this->assertSame( 'owner', $result[0]['data']['audience'], 'An error under the master_user ID is owner-scoped.' );
	}

	/**
	 * Test that jetpack_react_dashboard_error() exposes a user-scoped audience: an
	 * error tied to a specific (non-owner) user's token. With no connection owner on
	 * record, a positive user ID is classified as that user's error.
	 */
	public function test_jetpack_react_dashboard_error_includes_user_audience() {
		$this->store_single_verified_error( 'no_valid_user_token', '5' );

		$result = $this->error_handler->jetpack_react_dashboard_error( array() );

		$this->assertCount( 1, $result );
		$this->assertSame( 'user', $result[0]['data']['audience'], "A non-owner user's token error is user-scoped." );
	}

	/**
	 * Stores a single verified error under a given error code and user ID.
	 *
	 * @param string $error_code The (displayable) error code.
	 * @param string $user_id    The user ID key the error is stored under.
	 */
	private function store_single_verified_error( $error_code, $user_id ) {
		update_option(
			Error_Handler::STORED_VERIFIED_ERRORS_OPTION,
			array(
				$error_code => array(
					$user_id => array(
						'error_code'    => $error_code,
						'user_id'       => $user_id,
						'error_message' => 'Test message',
						'error_data'    => array(),
						'timestamp'     => time(),
						'nonce'         => 'test_nonce',
						'error_type'    => 'xmlrpc',
					),
				),
			)
		);
	}

	/**
	 * Test build_action_error_data method with default values
	 */
	public function test_build_action_error_data_defaults() {
		// Test with empty args
		$result = $this->error_handler->build_action_error_data();

		$this->assertArrayHasKey( 'blog_id', $result );
		$this->assertArrayHasKey( 'action_variant', $result );
		$this->assertArrayHasKey( 'secondary_action_variant', $result );
		$this->assertEquals( 'primary', $result['action_variant'] );
		$this->assertEquals( 'secondary', $result['secondary_action_variant'] );
	}

	/**
	 * Test build_action_error_data method with custom values
	 */
	public function test_build_action_error_data_custom_values() {
		$args = array(
			'action'                   => 'custom_action',
			'action_label'             => 'Custom Action',
			'action_variant'           => 'primary',
			'secondary_action'         => 'secondary_action',
			'secondary_action_label'   => 'Secondary Action',
			'secondary_action_variant' => 'secondary',
			'tracking_event'           => 'jetpack_custom_tracking',
		);

		$result = $this->error_handler->build_action_error_data( $args );

		$expected_fields = array(
			'action'                   => 'custom_action',
			'action_label'             => 'Custom Action',
			'action_variant'           => 'primary',
			'secondary_action'         => 'secondary_action',
			'secondary_action_label'   => 'Secondary Action',
			'secondary_action_variant' => 'secondary',
			'tracking_event'           => 'jetpack_custom_tracking',
		);

		foreach ( $expected_fields as $field => $expected_value ) {
			$this->assertEquals( $expected_value, $result[ $field ] );
		}
		$this->assertArrayHasKey( 'blog_id', $result );
	}

	/**
	 * Test build_action_error_data method with extra_data
	 */
	public function test_build_action_error_data_with_extra_data() {
		$args = array(
			'action'     => 'custom_action',
			'extra_data' => array(
				'custom_field'  => 'custom_value',
				'another_field' => 'another_value',
			),
		);

		$result = $this->error_handler->build_action_error_data( $args );

		$this->assertArrayHasKey( 'blog_id', $result );
		$this->assertEquals( 'custom_action', $result['action'] );
		$this->assertEquals( 'custom_value', $result['custom_field'] );
		$this->assertEquals( 'another_value', $result['another_field'] );
		$this->assertArrayNotHasKey( 'extra_data', $result );
	}

	/**
	 * Test build_action_error_data method with invalid variant values
	 */
	public function test_build_action_error_data_invalid_variants() {
		$args = array(
			'action_variant'           => 'invalid_variant',
			'secondary_action_variant' => 'also_invalid',
		);

		$result = $this->error_handler->build_action_error_data( $args );

		$this->assertEquals( 'primary', $result['action_variant'] );
		$this->assertEquals( 'secondary', $result['secondary_action_variant'] );
	}

	/**
	 * Test build_action_error_data method filters empty values
	 */
	public function test_build_action_error_data_filters_empty_values() {
		$args = array(
			'action'       => 'custom_action',
			'action_label' => 'Custom Action',
			'empty_field'  => '',
			'null_field'   => null,
			'zero_field'   => 0,
			'false_field'  => false,
		);

		$result = $this->error_handler->build_action_error_data( $args );

		$this->assertArrayHasKey( 'action', $result );
		$this->assertArrayHasKey( 'action_label', $result );
		$this->assertArrayNotHasKey( 'empty_field', $result );
		$this->assertArrayNotHasKey( 'null_field', $result );
		$this->assertArrayNotHasKey( 'zero_field', $result );
		$this->assertArrayNotHasKey( 'false_field', $result );
	}

	/**
	 * Test verify_xml_rpc_error method with valid nonce
	 */
	public function test_verify_xml_rpc_error_valid_nonce() {
		// Create a test error
		$error_data = array(
			'error_code'    => 'test_error',
			'user_id'       => '1',
			'error_message' => 'Test error message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'test_nonce_123',
			'error_type'    => 'xmlrpc',
		);

		// Store the error
		$stored_errors = array(
			'test_error' => array(
				'1' => $error_data,
			),
		);
		update_option( 'jetpack_connection_xmlrpc_errors', $stored_errors );

		// Create a mock request
		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/verify_xmlrpc_error' );
		$request->set_param( 'nonce', 'test_nonce_123' );

		// Call the method
		$response = $this->error_handler->verify_xml_rpc_error( $request );

		// Verify the response
		$this->assertInstanceOf( '\WP_REST_Response', $response );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data() );

		// Verify the error was moved to verified errors
		$verified_errors = $this->error_handler->get_verified_errors();
		$this->assertArrayHasKey( 'test_error', $verified_errors );
		$this->assertArrayHasKey( '1', $verified_errors['test_error'] );
		$this->assertEquals( 'test_nonce_123', $verified_errors['test_error']['1']['nonce'] );
	}

	/**
	 * Test verify_xml_rpc_error method with invalid nonce
	 */
	public function test_verify_xml_rpc_error_invalid_nonce() {
		// Create a mock request with invalid nonce
		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/verify_xmlrpc_error' );
		$request->set_param( 'nonce', 'invalid_nonce' );

		// Call the method
		$response = $this->error_handler->verify_xml_rpc_error( $request );

		// Verify the response
		$this->assertInstanceOf( '\WP_REST_Response', $response );
		$this->assertEquals( 200, $response->get_status() );
		$this->assertFalse( $response->get_data() );
	}

	/**
	 * Test build_action_error_data method with secondary button data
	 */
	public function test_build_action_error_data_secondary_button() {
		$args = array(
			'action'                   => 'primary_action',
			'action_label'             => 'Primary Action',
			'secondary_action'         => 'secondary_action',
			'secondary_action_label'   => 'Secondary Action',
			'secondary_action_url'     => 'https://example.com/secondary',
			'secondary_tracking_event' => 'jetpack_secondary_tracking',
		);

		$result = $this->error_handler->build_action_error_data( $args );

		$this->assertArrayHasKey( 'blog_id', $result );
		$this->assertEquals( 'primary_action', $result['action'] );
		$this->assertEquals( 'Primary Action', $result['action_label'] );
		$this->assertEquals( 'secondary_action', $result['secondary_action'] );
		$this->assertEquals( 'Secondary Action', $result['secondary_action_label'] );
		$this->assertEquals( 'https://example.com/secondary', $result['secondary_action_url'] );
		$this->assertEquals( 'jetpack_secondary_tracking', $result['secondary_tracking_event'] );
	}

	/**
	 * Test that get_displayable_errors classifies each error's audience by user ID.
	 */
	public function test_get_displayable_errors_classifies_audience() {
		\Jetpack_Options::update_option( 'master_user', 7 );

		$make_error = function ( $error_code, $user_id ) {
			return array(
				'error_code'    => $error_code,
				'user_id'       => (string) $user_id,
				'error_message' => 'Test message',
				'error_data'    => array(),
				'timestamp'     => time(),
				'nonce'         => 'nonce_' . $user_id,
				'error_type'    => 'xmlrpc',
			);
		};

		$verified_errors = array(
			'invalid_token'       => array( '0' => $make_error( 'invalid_token', 0 ) ),
			'no_valid_user_token' => array( '7' => $make_error( 'no_valid_user_token', 7 ) ),
			'no_token_for_user'   => array( '3' => $make_error( 'no_token_for_user', 3 ) ),
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

		$result = $this->error_handler->get_displayable_errors();

		$this->assertSame( 'site', $result['invalid_token']['0']['audience'], 'A blog-token error (user 0) is site-wide.' );
		$this->assertSame( 'owner', $result['no_valid_user_token']['7']['audience'], "The connection owner's token error is owner-scoped." );
		$this->assertSame( 'user', $result['no_token_for_user']['3']['audience'], "A non-owner user's token error is user-scoped." );
	}

	/**
	 * Test that an error that cannot be attributed to the blog token or any user's token
	 * (user_id 'invalid') is not displayed at all.
	 */
	public function test_get_displayable_errors_skips_unattributable_errors() {
		$error = array(
			'error_code'    => 'malformed_token',
			'user_id'       => 'invalid',
			'error_message' => 'Test message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'nonce_invalid',
			'error_type'    => 'xmlrpc',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'malformed_token' => array( 'invalid' => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$this->assertArrayNotHasKey( 'malformed_token', $result, 'Unattributable errors belong to no audience and must not be displayed.' );
	}

	/**
	 * Test that `no_user_tokens` is not displayable: with an empty user_tokens option the
	 * site already presents as site-only connected and the connection UI prompts users to
	 * connect, so the notice adds nothing actionable.
	 */
	public function test_get_displayable_errors_excludes_no_user_tokens() {
		$error = array(
			'error_code'    => 'no_user_tokens',
			'user_id'       => '5',
			'error_message' => 'No user tokens found',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'nonce_5',
			'error_type'    => 'xmlrpc',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'no_user_tokens' => array( '5' => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$this->assertArrayNotHasKey( 'no_user_tokens', $result );
	}

	/**
	 * Test that a secondary admin sees an informational (no-CTA) notice for an owner-token
	 * error when connection ownership is locked (non-transferable).
	 */
	public function test_get_displayable_errors_locked_owner_shows_informational_notice() {
		$owner_id = 999;
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		// Act as a secondary admin (a different user than the owner).
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'secondary_admin',
				'user_pass'  => 'password',
				'user_email' => 'secondary_admin@example.org',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $admin_id );
		$this->assertNotSame( $owner_id, $admin_id );
		wp_set_current_user( $admin_id );

		// Lock ownership.
		add_filter( 'jetpack_connection_ownership_transferable', '__return_false' );

		$error = array(
			'error_code'    => 'no_valid_user_token',
			'user_id'       => (string) $owner_id,
			'error_message' => 'Original message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'nonce_owner',
			'error_type'    => 'xmlrpc',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'no_valid_user_token' => array( (string) $owner_id => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$displayed = $result['no_valid_user_token'][ (string) $owner_id ];
		$this->assertSame( 'owner', $displayed['audience'] );
		$this->assertSame( 'none', $displayed['error_data']['action'], 'Locked ownership must suppress the reconnect CTA for a secondary admin.' );
		$this->assertStringContainsString( 'reconnect their WordPress.com account', $displayed['error_message'] );
	}

	/**
	 * Test that a secondary admin still gets the reconnect CTA for an owner-token error
	 * when ownership is transferable (the default model).
	 */
	public function test_get_displayable_errors_transferable_owner_keeps_reconnect() {
		$owner_id = 999;
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'secondary_admin',
				'user_pass'  => 'password',
				'user_email' => 'secondary_admin@example.org',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		// Ownership transferable is the default (no filter added).

		$error = array(
			'error_code'    => 'no_valid_user_token',
			'user_id'       => (string) $owner_id,
			'error_message' => 'Original message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'nonce_owner',
			'error_type'    => 'xmlrpc',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'no_valid_user_token' => array( (string) $owner_id => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$displayed = $result['no_valid_user_token'][ (string) $owner_id ];
		$this->assertSame( 'owner', $displayed['audience'] );
		$this->assertArrayNotHasKey( 'action', $displayed['error_data'], 'No explicit action is emitted for the default behavior: readers fall back to the reconnect CTA.' );
		$this->assertStringContainsString( 'broken', $displayed['error_message'] );
	}

	/**
	 * Test that an `invalid_connection_owner` error, reported with an empty token but an
	 * explicit `user_id` in its error data (as Manager::get_connection_owner() reports it),
	 * is stored under the owner's real user ID via the wp_error_to_array() fallback and is
	 * classified as owner-scoped, showing a secondary admin on a locked site an
	 * informational notice with no reconnect CTA.
	 */
	public function test_get_displayable_errors_invalid_connection_owner_is_owner_scoped() {
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$owner_id = wp_insert_user(
			array(
				'user_login'   => 'connection_owner',
				'user_pass'    => 'password',
				'user_email'   => 'connection_owner@example.org',
				'display_name' => 'Owner Person',
				'role'         => 'administrator',
			)
		);
		$this->assertIsInt( $owner_id );
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		// Act as a secondary admin (a different user than the owner) who can act on
		// connection issues (the mapped jetpack_connect capability is not set up in
		// tests, so grant it directly).
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'secondary_admin',
				'user_pass'  => 'password',
				'user_email' => 'secondary_admin@example.org',
				'role'       => 'administrator',
			)
		);
		get_user_by( 'id', $admin_id )->add_cap( 'jetpack_connect' );
		wp_set_current_user( $admin_id );

		// Lock ownership.
		add_filter( 'jetpack_connection_ownership_transferable', '__return_false' );

		// Report the error exactly the way Manager::get_connection_owner() does:
		// empty token, explicit user_id in the error data, locally verified.
		$this->error_handler->report_error(
			new \WP_Error(
				'invalid_connection_owner',
				'Invalid connection owner',
				array(
					'user_id'           => $owner_id,
					'has_user_token'    => false,
					'error_type'        => 'connection',
					'signature_details' => array(
						'token' => '',
					),
				)
			),
			false,
			true
		);

		$result = $this->error_handler->get_displayable_errors();

		$this->assertArrayHasKey( 'invalid_connection_owner', $result );
		$this->assertArrayHasKey( (string) $owner_id, $result['invalid_connection_owner'], 'The error must be attributed to the owner via the error-data user_id fallback.' );

		$displayed = $result['invalid_connection_owner'][ (string) $owner_id ];
		$this->assertSame( 'owner', $displayed['audience'], 'An error stored under the master_user ID is owner-scoped.' );
		$this->assertSame( 'none', $displayed['error_data']['action'], 'Locked ownership must suppress the reconnect CTA for a secondary admin.' );
		$this->assertStringContainsString( 'Owner Person', $displayed['error_message'], 'The informational notice names the local connection owner.' );
		$this->assertFalse( $displayed['error_data']['has_user_token'], 'has_user_token is preserved so display code can distinguish a missing token from a deleted owner user.' );
	}

	/**
	 * Test that the owner's display name is not exposed to viewers who cannot act on
	 * connection issues (no jetpack_connect capability): displayable errors are printed
	 * into the initial state for any logged-in user loading connection scripts.
	 */
	public function test_get_displayable_errors_hides_owner_name_without_capability() {
		$owner_id = wp_insert_user(
			array(
				'user_login'   => 'connection_owner',
				'user_pass'    => 'password',
				'user_email'   => 'connection_owner@example.org',
				'display_name' => 'Owner Person',
				'role'         => 'administrator',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		// Act as a viewer without the jetpack_connect capability (e.g. a contributor).
		$contributor_id = wp_insert_user(
			array(
				'user_login' => 'contributor_viewer',
				'user_pass'  => 'password',
				'user_email' => 'contributor_viewer@example.org',
				'role'       => 'contributor',
			)
		);
		wp_set_current_user( $contributor_id );

		// Lock ownership so the informational branch (the only one naming the owner) runs.
		add_filter( 'jetpack_connection_ownership_transferable', '__return_false' );

		$error = array(
			'error_code'    => 'no_valid_user_token',
			'user_id'       => (string) $owner_id,
			'error_message' => 'Original message',
			'error_data'    => array(),
			'timestamp'     => time(),
			'nonce'         => 'nonce_owner',
			'error_type'    => 'xmlrpc',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'no_valid_user_token' => array( (string) $owner_id => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$displayed = $result['no_valid_user_token'][ (string) $owner_id ];
		$this->assertSame( 'none', $displayed['error_data']['action'] );
		$this->assertStringNotContainsString( 'Owner Person', $displayed['error_message'], 'The owner name must not be exposed to low-capability viewers.' );
		$this->assertStringContainsString( 'reconnect their WordPress.com account', $displayed['error_message'], 'The nameless informational variant is used instead.' );
	}

	/**
	 * Test that a legacy `invalid_connection_owner` entry still stored under the 'invalid'
	 * key (written before user attribution was fixed) is skipped from display rather than
	 * shown with a misleading site-wide reconnect message. It expires via the garbage
	 * collector within ERROR_LIFE_TIME.
	 */
	public function test_get_displayable_errors_skips_legacy_invalid_connection_owner_entry() {
		$error = array(
			'error_code'    => 'invalid_connection_owner',
			'user_id'       => 'invalid',
			'error_message' => 'Invalid connection owner',
			'error_data'    => array( 'token' => '' ),
			'timestamp'     => time(),
			'nonce'         => 'nonce_invalid_owner',
			'error_type'    => 'connection',
		);
		update_option( Error_Handler::STORED_VERIFIED_ERRORS_OPTION, array( 'invalid_connection_owner' => array( 'invalid' => $error ) ) );

		$result = $this->error_handler->get_displayable_errors();

		$this->assertArrayNotHasKey( 'invalid_connection_owner', $result );
	}

	/**
	 * Test that a consumer-injected error takes precedence over the default state and
	 * survives the viewer-aware pipeline unchanged, including when it omits the optional
	 * `audience` field (backward-compatibility guarantee for pluggable notices).
	 */
	public function test_get_displayable_errors_preserves_injected_error() {
		// Force error filtering on regardless of host, so the injected filter runs.
		$handler = new class() extends Error_Handler {
			public function __construct() {
			}
			public function should_allow_error_filtering() {
				return true;
			}
		};

		add_filter(
			'jetpack_connection_get_verified_errors',
			function ( $errors ) {
				$errors['protected_owner_missing'] = array(
					'0' => array(
						'error_code'    => 'protected_owner_missing',
						'user_id'       => '0',
						'error_message' => 'The owner account is missing.',
						'error_data'    => array(
							'action'       => 'create_missing_account',
							'action_label' => 'Create Account',
							'action_url'   => 'https://example.org/wp-admin/user-new.php',
						),
						'timestamp'     => time(),
						'nonce'         => 'injected_nonce',
						'error_type'    => 'protected_owner',
					),
				);
				return $errors;
			}
		);

		$result = $handler->get_displayable_errors();

		$this->assertArrayHasKey( 'protected_owner_missing', $result, 'Injected errors must survive the viewer-aware pipeline.' );
		$injected = $result['protected_owner_missing']['0'];
		$this->assertSame( 'create_missing_account', $injected['error_data']['action'], "The injected error's custom action is preserved." );
		$this->assertSame( 'The owner account is missing.', $injected['error_message'], "The injected error's message is preserved." );
		// The optional `audience` field is not required and is left untouched on injected errors.
		$this->assertArrayNotHasKey( 'audience', $injected, 'Injected errors are not mutated with an audience default.' );
	}
}
