<?php
/**
 * Protected Owner Error Handler Test file.
 *
 * @package wpcomsh
 */

use Automattic\WPComSH\Connection\Protected_Owner_Error_Handler;

/**
 * Class ProtectedOwnerErrorHandlerTest.
 */
class ProtectedOwnerErrorHandlerTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The Protected_Owner_Error_Handler instance being tested.
	 *
	 * @var Protected_Owner_Error_Handler
	 */
	private $handler;

	/**
	 * Set up test environment before each test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->handler = Protected_Owner_Error_Handler::get_instance();

		// Clean up any existing error data
		delete_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION );
		delete_option( 'jetpack_connection_xmlrpc_verified_errors' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		delete_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION );
		delete_option( 'jetpack_connection_xmlrpc_verified_errors' );
		parent::tearDown();
	}

	/**
	 * Test that the class implements singleton pattern correctly.
	 */
	public function test_singleton_pattern() {
		$instance1 = Protected_Owner_Error_Handler::get_instance();
		$instance2 = Protected_Owner_Error_Handler::get_instance();

		$this->assertSame( $instance1, $instance2 );
		$this->assertInstanceOf( Protected_Owner_Error_Handler::class, $instance1 );
	}

	/**
	 * Test handle_error returns original errors when no error is stored.
	 */
	public function test_handle_error_returns_original_errors_when_no_error_stored() {
		$original_errors = array( 'some_error' => array( '1' => array( 'data' => 'test' ) ) );
		$result          = $this->handler->handle_error( $original_errors );
		$this->assertEquals( $original_errors, $result );
	}

	/**
	 * Test handle_error returns original errors for invalid data.
	 */
	public function test_handle_error_returns_original_errors_for_invalid_data() {
		$original_errors = array( 'some_error' => array( '1' => array( 'data' => 'test' ) ) );

		// Test with non-array data
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, 'invalid_data' );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( $original_errors, $result );

		// Test with missing error_type
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'email' => 'test@example.com' ) );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( $original_errors, $result );

		// Test with missing email
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'error_type' => 'missing_owner' ) );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( $original_errors, $result );
	}

	/**
	 * Test handle_error returns original errors when user exists.
	 */
	public function test_handle_error_returns_original_errors_when_user_exists() {
		$test_email      = 'test@example.com';
		$original_errors = array( 'some_error' => array( '1' => array( 'data' => 'test' ) ) );

		// Create a user with the required email
		$this->factory()->user->create( array( 'user_email' => $test_email ) );

		// Set up an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->handle_error( $original_errors );

		// Should return original errors and delete the stored error
		$this->assertEquals( $original_errors, $result );
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}

	/**
	 * Test handle_error returns protected owner error when user doesn't exist.
	 */
	public function test_handle_error_returns_protected_owner_error() {
		$test_email      = 'test@example.com';
		$test_timestamp  = time();
		$original_errors = array( 'some_error' => array( '1' => array( 'data' => 'test' ) ) );

		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
				'timestamp'  => $test_timestamp,
			)
		);

		$result = $this->handler->handle_error( $original_errors );

		// Should return only the protected owner error (takes priority)
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'protected_owner_missing', $result );
		$this->assertArrayNotHasKey( 'some_error', $result );

		$error_data = $result['protected_owner_missing']['0'];
		$this->assertEquals( 'protected_owner_missing', $error_data['error_code'] );
		$this->assertSame( '0', $error_data['user_id'] );
		$this->assertEquals( 'protected_owner', $error_data['error_type'] );
		$this->assertEquals( $test_timestamp, $error_data['timestamp'] );
		$this->assertArrayHasKey( 'error_message', $error_data );
		$this->assertStringContainsString( $test_email, $error_data['error_message'] );
		$this->assertArrayHasKey( 'error_data', $error_data );
		$this->assertEquals( $test_email, $error_data['error_data']['email'] );
		$this->assertEquals( 'missing_owner', $error_data['error_data']['error_type'] );
	}

	/**
	 * Test add_to_react_dashboard returns original errors when no error is stored.
	 */
	public function test_add_to_react_dashboard_returns_original_errors_when_no_error_stored() {
		$original_errors = array(
			array(
				'code'    => 'some_error',
				'message' => 'test',
			),
		);
		$result          = $this->handler->add_to_react_dashboard( $original_errors );
		$this->assertEquals( $original_errors, $result );
	}

	/**
	 * Test add_to_react_dashboard returns original errors when user exists.
	 */
	public function test_add_to_react_dashboard_returns_original_errors_when_user_exists() {
		$test_email      = 'test@example.com';
		$original_errors = array(
			array(
				'code'    => 'some_error',
				'message' => 'test',
			),
		);

		// Create a user with the required email
		$this->factory()->user->create( array( 'user_email' => $test_email ) );

		// Set up an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->add_to_react_dashboard( $original_errors );

		// Should return original errors unchanged
		$this->assertEquals( $original_errors, $result );
	}

	/**
	 * Test add_to_react_dashboard adds protected owner error when user doesn't exist.
	 */
	public function test_add_to_react_dashboard_adds_protected_owner_error() {
		$test_email      = 'test@example.com';
		$original_errors = array(
			array(
				'code'    => 'some_error',
				'message' => 'test',
			),
		);

		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->add_to_react_dashboard( $original_errors );

		// Should have both original error and new protected owner error
		$this->assertCount( 2, $result );
		$this->assertEquals( 'some_error', $result[0]['code'] );
		$this->assertEquals( 'protected_owner_missing', $result[1]['code'] );
		$this->assertStringContainsString( $test_email, $result[1]['message'] );
		$this->assertEquals( 'protected_owner_action', $result[1]['action'] );
		$this->assertArrayHasKey( 'action_links', $result[1] );
		$this->assertTrue( $result[1]['can_be_fixed'] );
	}

	/**
	 * Test delete_error method.
	 */
	public function test_delete_error() {
		// Set an error first
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => 'test@example.com',
			)
		);

		// Set up verified errors to test cleanup
		update_option(
			'jetpack_connection_xmlrpc_verified_errors',
			array(
				'protected_owner_missing' => array(
					'0' => array( 'error_code' => 'protected_owner_missing' ),
				),
				'other_error'             => array(
					'1' => array( 'error_code' => 'other_error' ),
				),
			)
		);

		// Verify errors exist
		$this->assertNotFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
		$verified_errors = get_option( 'jetpack_connection_xmlrpc_verified_errors' );
		$this->assertArrayHasKey( 'protected_owner_missing', $verified_errors );

		// Delete the error
		$this->handler->delete_error();

		// Verify our error is gone
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );

		// Verify our error is removed from verified errors but other errors remain
		$verified_errors = get_option( 'jetpack_connection_xmlrpc_verified_errors' );
		$this->assertArrayNotHasKey( 'protected_owner_missing', $verified_errors );
		$this->assertArrayHasKey( 'other_error', $verified_errors );
	}

	/**
	 * Test delete_error clears verified errors completely when only our error exists.
	 */
	public function test_delete_error_clears_verified_errors_completely() {
		// Set an error first
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => 'test@example.com',
			)
		);

		// Set up verified errors with only our error
		update_option(
			'jetpack_connection_xmlrpc_verified_errors',
			array(
				'protected_owner_missing' => array(
					'0' => array( 'error_code' => 'protected_owner_missing' ),
				),
			)
		);

		// Delete the error
		$this->handler->delete_error();

		// Verify both options are completely removed
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
		$this->assertFalse( get_option( 'jetpack_connection_xmlrpc_verified_errors' ) );
	}

	/**
	 * Test delete_error_and_return_unfiltered_value method.
	 */
	public function test_delete_error_and_return_unfiltered_value() {
		// Set an error first
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => 'test@example.com',
			)
		);

		$test_value = 'test_return_value';
		$result     = $this->handler->delete_error_and_return_unfiltered_value( $test_value );

		// Verify the value is returned unchanged
		$this->assertEquals( $test_value, $result );

		// Verify error is deleted
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}

	/**
	 * Test check_and_clear_error_for_user method with matching email.
	 */
	public function test_check_and_clear_error_for_user_matching_email() {
		$test_email = 'test@example.com';

		// Set an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		// Create a user with matching email
		$user_id = $this->factory()->user->create( array( 'user_email' => $test_email ) );

		// Simulate user creation/update
		$this->handler->check_and_clear_error_for_user( $user_id );

		// Error should be cleared
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}

	/**
	 * Test check_and_clear_error_for_user method with non-matching email.
	 */
	public function test_check_and_clear_error_for_user_non_matching_email() {
		$test_email = 'test@example.com';

		// Set an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		// Create a user with different email
		$user_id = $this->factory()->user->create( array( 'user_email' => 'different@example.com' ) );

		// Simulate user creation/update
		$this->handler->check_and_clear_error_for_user( $user_id );

		// Error should remain
		$this->assertNotFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}

	/**
	 * Test check_and_clear_error_for_user method with no error stored.
	 */
	public function test_check_and_clear_error_for_user_no_error_stored() {
		// Create a user
		$user_id = $this->factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		// This should not cause any errors
		$this->handler->check_and_clear_error_for_user( $user_id );

		// No error should be created
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}
}
