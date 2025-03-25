<?php
/**
 * REST_Connector functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * REST_Connector functionality testing.
 */
class REST_Connector_Test extends TestCase {

	/**
	 * The current user ID.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	public function set_up() {
		// Create an admin user for testing
		self::$admin_user_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_pass'  => 'password',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);

		// Create a regular user for testing
		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user',
				'user_pass'  => 'password',
				'user_email' => 'test@example.com',
				'role'       => 'subscriber',
			)
		);

		// Create mock data to simulate specific testing scenarios
		$this->set_up_transients();
	}

	/**
	 * Set up transients for testing.
	 */
	private function set_up_transients() {
		// The clean function will clean this up if needed
		$transient_key = 'jetpack_account_mismatch_' . md5( 'wpcom@example.com' );
		set_transient( $transient_key, true, DAY_IN_SECONDS );
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		$users = get_users();
		foreach ( $users as $user ) {
			wp_delete_user( $user->ID );
		}

		// Clean up transients
		delete_transient( 'jetpack_account_mismatch_' . md5( 'wpcom@example.com' ) );
		delete_transient( 'jetpack_account_mismatch_' . md5( 'another_wpcom@example.com' ) );
	}

	/**
	 * Test possible_account_mismatch with matching emails.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::possible_account_mismatch
	 */
	public function test_possible_account_mismatch_with_matching_emails() {
		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'possible_account_mismatch' );
		$method->setAccessible( true );

		// When emails match, should return false
		$result = $method->invokeArgs( null, array( 'same@example.com', 'same@example.com' ) );
		$this->assertFalse( $result );
	}

	/**
	 * Test possible_account_mismatch with empty WPCOM email.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::possible_account_mismatch
	 */
	public function test_possible_account_mismatch_with_empty_wpcom_email() {
		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'possible_account_mismatch' );
		$method->setAccessible( true );

		// When WPCOM email is empty, should return false
		$result = $method->invokeArgs( null, array( 'local@example.com', '' ) );
		$this->assertFalse( $result );
	}

	/**
	 * Test possible_account_mismatch with existing transient.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::possible_account_mismatch
	 */
	public function test_possible_account_mismatch_with_existing_transient() {
		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'possible_account_mismatch' );
		$method->setAccessible( true );

		// When transient exists, should return the cached value (true in this case)
		$result = $method->invokeArgs( null, array( 'local@example.com', 'wpcom@example.com' ) );
		$this->assertTrue( $result );
	}

	/**
	 * Test possible_account_mismatch with a local user having WPCOM email.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::possible_account_mismatch
	 */
	public function test_possible_account_mismatch_with_local_user_having_wpcom_email() {
		// Delete any existing transient
		delete_transient( 'jetpack_account_mismatch_' . md5( 'another_wpcom@example.com' ) );

		// Create a user with the WPCOM email
		wp_insert_user(
			array(
				'user_login' => 'wpcom_user',
				'user_pass'  => 'password',
				'user_email' => 'another_wpcom@example.com',
				'role'       => 'subscriber',
			)
		);

		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'possible_account_mismatch' );
		$method->setAccessible( true );

		// When a local user has the WPCOM email, should return true
		$result = $method->invokeArgs( null, array( 'local@example.com', 'another_wpcom@example.com' ) );
		$this->assertTrue( $result );

		// Check that the result was saved in a transient
		$this->assertTrue(
			get_transient( 'jetpack_account_mismatch_' . md5( 'another_wpcom@example.com' ) )
		);
	}

	/**
	 * Test check_account_errors with no errors.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::check_account_errors
	 */
	public function test_check_account_errors_with_no_errors() {
		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'check_account_errors' );
		$method->setAccessible( true );

		// Use same email to avoid mismatch (no errors)
		$result = $method->invokeArgs( null, array( 'same@example.com', 'same@example.com' ) );
		$this->assertEmpty( $result );
	}

	/**
	 * Test check_account_errors with mismatch error.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::check_account_errors
	 */
	public function test_check_account_errors_with_mismatch_error() {
		$reflection = new \ReflectionClass( '\Automattic\Jetpack\Connection\REST_Connector' );
		$method     = $reflection->getMethod( 'check_account_errors' );
		$method->setAccessible( true );

		// Create a scenario where there's a mismatch
		$current_user_email = 'local@example.com';
		$wpcom_user_email   = 'wpcom@example.com';

		// When there's a mismatch, should return an array with mismatch error
		$result = $method->invokeArgs( null, array( $current_user_email, $wpcom_user_email ) );

		$this->assertArrayHasKey( 'mismatch', $result );
		$this->assertEquals( 'mismatch', $result['mismatch']['type'] );
		$this->assertNotEmpty( $result['mismatch']['message'] );

		// Verify details are correct
		$this->assertEquals( $current_user_email, $result['mismatch']['details']['site_email'] );
		$this->assertEquals( $wpcom_user_email, $result['mismatch']['details']['wpcom_email'] );
	}

	/**
	 * Test unlink_user with invalid parameter.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::unlink_user
	 */
	public function test_unlink_user_with_invalid_parameter() {
		$request = new WP_REST_Request();
		$request->set_param( 'linked', true );

		$result = REST_Connector::unlink_user( $request );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'invalid_param', $result->get_error_code() );
	}

	/**
	 * Test unlink_user when user is connection owner without disconnect-all-users parameter.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::unlink_user
	 */
	public function test_unlink_user_as_connection_owner_without_disconnect_all_param() {
		wp_set_current_user( self::$admin_user_id );

		// Mock get_connection_owner_id() to return the admin user ID
		add_filter(
			'jetpack_connection_owner_id',
			function () {
				return self::$admin_user_id;
			}
		);

		$request = new WP_REST_Request();
		$request->set_param( 'linked', false );

		$result = REST_Connector::unlink_user( $request );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'unlink_user_failed', $result->get_error_code() );

		remove_all_filters( 'jetpack_connection_owner_id' );
	}

	/**
	 * Test unlink_user as regular user.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::unlink_user
	 */
	public function test_unlink_user_as_regular_user() {
		wp_set_current_user( self::$user_id );

		// Mock get_connection_owner_id() to return the admin user ID
		add_filter(
			'jetpack_connection_owner_id',
			function () {
				return self::$admin_user_id;
			}
		);

		// Mock disconnect_user() to return true
		add_filter(
			'jetpack_disconnect_user_result',
			'__return_true'
		);

		$request = new WP_REST_Request();
		$request->set_param( 'linked', false );

		// We need to catch the response before it's sent
		ob_start();
		$result = REST_Connector::unlink_user( $request );
		ob_end_clean();

		$this->assertInstanceOf( 'WP_REST_Response', $result );
		$response_data = (array) $result->data;
		$this->assertEquals( 'success', $response_data['code'] );

		remove_all_filters( 'jetpack_connection_owner_id' );
		remove_all_filters( 'jetpack_disconnect_user_result' );
	}

	/**
	 * Test unlink_user with disconnect failure.
	 *
	 * @covers \Automattic\Jetpack\Connection\REST_Connector::unlink_user
	 */
	public function test_unlink_user_with_disconnect_failure() {
		wp_set_current_user( self::$user_id );

		// Mock get_connection_owner_id() to return the admin user ID
		add_filter(
			'jetpack_connection_owner_id',
			function () {
				return self::$admin_user_id;
			}
		);

		// Mock disconnect_user() to return false
		add_filter(
			'jetpack_disconnect_user_result',
			'__return_false'
		);

		$request = new WP_REST_Request();
		$request->set_param( 'linked', false );

		$result = REST_Connector::unlink_user( $request );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'unlink_user_failed', $result->get_error_code() );

		remove_all_filters( 'jetpack_connection_owner_id' );
		remove_all_filters( 'jetpack_disconnect_user_result' );
	}
}
