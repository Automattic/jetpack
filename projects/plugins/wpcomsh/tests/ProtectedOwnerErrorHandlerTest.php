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

		// Clear any existing master user
		\Jetpack_Options::delete_option( 'master_user' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		delete_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION );
		\Jetpack_Options::delete_option( 'master_user' );
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
	 * Test get_error returns false when no error is stored.
	 */
	public function test_get_error_returns_false_when_no_error_stored() {
		$result = $this->handler->get_error();
		$this->assertFalse( $result );
	}

	/**
	 * Test get_error returns false when invalid error data is stored.
	 */
	public function test_get_error_returns_false_for_invalid_data() {
		// Test with non-array data
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, 'invalid_data' );
		$this->assertFalse( $this->handler->get_error() );

		// Test with missing error_type
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'email' => 'test@example.com' ) );
		$this->assertFalse( $this->handler->get_error() );

		// Test with missing email
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'error_type' => 'missing_owner' ) );
		$this->assertFalse( $this->handler->get_error() );
	}

	/**
	 * Test get_error returns false for unrecognized error type.
	 */
	public function test_get_error_returns_false_for_unrecognized_error_type() {
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'unknown_error',
				'email'      => 'test@example.com',
			)
		);

		$this->assertFalse( $this->handler->get_error() );
	}

	/**
	 * Test get_error for missing_owner error type with no master user.
	 */
	public function test_get_error_missing_owner_no_master_user() {
		$test_email     = 'test@example.com';
		$test_timestamp = time();

		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
				'timestamp'  => $test_timestamp,
			)
		);

		$result = $this->handler->get_error();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'no_user_connection_protected_owner_missing', $result );

		$error_data = $result['no_user_connection_protected_owner_missing']['0'];
		$this->assertEquals( 'no_user_connection_protected_owner_missing', $error_data['error_code'] );
		$this->assertSame( '0', $error_data['user_id'] );
		$this->assertEquals( 'protected_owner', $error_data['error_type'] );
		$this->assertEquals( $test_timestamp, $error_data['timestamp'] );
		$this->assertArrayHasKey( 'error_message', $error_data );
		$this->assertArrayHasKey( 'error_data', $error_data );
		$this->assertEquals( $test_email, $error_data['error_data']['email'] );
		$this->assertEquals( 'missing_owner', $error_data['error_data']['error_type'] );
	}

	/**
	 * Test get_error for missing_owner error type with existing master user.
	 */
	public function test_get_error_missing_owner_with_master_user() {
		// Create a master user
		$user_id = $this->factory()->user->create( array( 'user_email' => 'master@example.com' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );

		$test_email = 'test@example.com';

		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->get_error();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'wrong_owner_protected_owner_missing', $result );

		$error_data = $result['wrong_owner_protected_owner_missing']['0'];
		$this->assertEquals( 'wrong_owner_protected_owner_missing', $error_data['error_code'] );
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

		// Verify error exists
		$this->assertNotFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );

		// Delete the error
		$this->handler->delete_error();

		// Verify error is gone
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
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

		// Simulate user creation
		$this->handler->check_and_clear_error_on_user_creation( $user_id );

		// Error should be cleared
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
	}

	/**
	 * Test add_to_verified_errors method.
	 */
	public function test_add_to_verified_errors() {
		// Set up an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => 'test@example.com',
			)
		);

		$existing_errors = array(
			'some_other_error' => array(
				'1' => array( 'some' => 'data' ),
			),
		);

		$result = $this->handler->add_to_verified_errors( $existing_errors );

		// Should return only the protected owner error (takes priority)
		$this->assertArrayHasKey( 'no_user_connection_protected_owner_missing', $result );
		$this->assertArrayNotHasKey( 'some_other_error', $result );
	}

	/**
	 * Test add_to_verified_errors when no error exists.
	 */
	public function test_add_to_verified_errors_no_error() {
		$existing_errors = array(
			'some_other_error' => array(
				'1' => array( 'some' => 'data' ),
			),
		);

		$result = $this->handler->add_to_verified_errors( $existing_errors );

		// Should return existing errors unchanged
		$this->assertEquals( $existing_errors, $result );
	}
}
