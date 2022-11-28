<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use WorDBless\BaseTestCase;

/**
 * Connection Manager functionality testing.
 */
class Error_Handler_Test extends BaseTestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * Initialize tests
	 *
	 * @before
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

		$this->arrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );

		$this->arrayHasKey( '1', $stored_errors['invalid_token'] );

		$this->arrayHasKey( 'nonce', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'error_code', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'user_id', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'error_message', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'error_data', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'timestamp', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'nonce', $stored_errors['invalid_token']['1'] );
		$this->arrayHasKey( 'error_type', $stored_errors['invalid_token']['1'] );
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );
	}

	/**
	 * Test storing errors
	 */
	public function test_store_multiple_error_codes() {

		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );

		$error  = $this->get_sample_error( 'invalid_token', 1, 'xmlrpc' );
		$error2 = $this->get_sample_error( 'unknown_user', 1, 'rest' );

		$this->error_handler->report_error( $error );
		$this->error_handler->report_error( $error2 );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertCount( 2, $stored_errors );

		$this->arrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 1, $stored_errors['unknown_user'] );

		$this->arrayHasKey( '1', $stored_errors['unknown_user'] );

		$this->arrayHasKey( 'error_type', $stored_errors['invalid_token']['1'] );
		$this->assertEquals( 'xmlrpc', $stored_errors['invalid_token']['1']['error_type'] );

		$this->arrayHasKey( 'nonce', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'error_code', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'user_id', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'error_message', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'error_data', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'timestamp', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'nonce', $stored_errors['unknown_user']['1'] );
		$this->arrayHasKey( 'error_type', $stored_errors['unknown_user']['1'] );
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

		$this->arrayHasKey( 'invalid_token', $stored_errors );

		$this->assertCount( 1, $stored_errors['invalid_token'] );
		$this->assertCount( 2, $stored_errors['unknown_user'] );

		$this->arrayHasKey( '2', $stored_errors['unknown_user'] );

		$this->arrayHasKey( 'nonce', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'error_code', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'user_id', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'error_message', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'error_data', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'timestamp', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'nonce', $stored_errors['unknown_user']['2'] );
		$this->arrayHasKey( 'error_type', $stored_errors['unknown_user']['2'] );
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
	public function get_user_id_from_token_data() {
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
		$this->arrayHasKey( 'unknown_token', $stored_errors );
		$this->assertCount( 1, $stored_errors['unknown_token'] );
		$this->arrayHasKey( '1', $stored_errors['unknown_token'] );
		$this->arrayHasKey( 'error_code', $stored_errors['unknown_token']['0'] );
		$this->arrayHasKey( 'error_type', $stored_errors['unknown_token']['0'] );
		$this->assertEquals( 'rest', $stored_errors['unknown_token']['0']['error_type'] );

		$this->assertCount( 1, $verified_errors );
		$this->arrayHasKey( 'unknown_token', $verified_errors );
		$this->assertCount( 1, $verified_errors['unknown_token'] );
		$this->arrayHasKey( '1', $verified_errors['unknown_token'] );
		$this->arrayHasKey( 'error_code', $verified_errors['unknown_token']['0'] );
		$this->assertEquals( 'rest', $verified_errors['unknown_token']['0']['error_type'] );
	}
}
