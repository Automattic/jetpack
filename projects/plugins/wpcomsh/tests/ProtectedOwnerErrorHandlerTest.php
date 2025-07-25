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
	 * Test has_enhanced_error_handling method.
	 */
	public function test_has_enhanced_error_handling() {
		$result = $this->handler->has_enhanced_error_handling();
		$this->assertIsBool( $result );
	}

	/**
	 * Test build_enhanced_error_data method when enhanced error handling is available.
	 */
	public function test_build_enhanced_error_data_when_available() {
		// Skip if enhanced error handling is not available
		if ( ! $this->handler->has_enhanced_error_handling() ) {
			$this->markTestSkipped( 'Enhanced error handling not available' );
		}

		$raw_error = array(
			'error_type' => 'missing_owner',
			'email'      => 'test@example.com',
		);

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'build_enhanced_error_data' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler, $raw_error );

		$this->assertIsArray( $result );
		$this->assertEquals( 'create_missing_account', $result['action'] );
		$this->assertEquals( 'test@example.com', $result['email'] );
	}

	/**
	 * Test build_enhanced_error_data method when enhanced error handling is not available.
	 */
	public function test_build_enhanced_error_data_when_not_available() {
		// Skip if enhanced error handling is available
		if ( $this->handler->has_enhanced_error_handling() ) {
			$this->markTestSkipped( 'Enhanced error handling is available' );
		}

		$raw_error = array(
			'error_type' => 'missing_owner',
			'email'      => 'test@example.com',
		);

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'build_enhanced_error_data' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler, $raw_error );

		$this->assertFalse( $result );
	}

	/**
	 * Test build_legacy_error_data method.
	 */
	public function test_build_legacy_error_data() {
		$raw_error = array(
			'error_type' => 'missing_owner',
			'email'      => 'test@example.com',
		);

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'build_legacy_error_data' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler, $raw_error );

		$this->assertIsArray( $result );
		$this->assertEquals( 'test@example.com', $result['email'] );
		$this->assertEquals( 'create_missing_account', $result['action'] );
	}

	/**
	 * Test handle_error method returns protected owner error when active error exists.
	 */
	public function test_handle_error_returns_protected_owner_error() {
		$test_email = 'test@example.com';

		// Set an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->handle_error( array() );

		$this->assertArrayHasKey( 'protected_owner_missing', $result );
		$error_details = $result['protected_owner_missing']['0'];
		$this->assertEquals( 'protected_owner_missing', $error_details['error_code'] );
		$this->assertEquals( $test_email, $error_details['error_data']['email'] );
	}

	/**
	 * Test handle_error method returns empty array when no active error exists.
	 */
	public function test_handle_error_returns_empty_when_no_active_error() {
		delete_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION );

		$result = $this->handler->handle_error( array() );

		$this->assertEmpty( $result );
	}

	/**
	 * Test handle_error method clears error when user exists.
	 */
	public function test_handle_error_clears_error_when_user_exists() {
		$test_email = 'test@example.com';

		// Create a user with the test email
		$this->factory()->user->create( array( 'user_email' => $test_email ) );

		// Set an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		$result = $this->handler->handle_error( array() );

		$this->assertEmpty( $result );
		$this->assertFalse( get_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION ) );
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

		// Verify our error is gone
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

	/**
	 * Test get_prepopulation_email from URL parameters.
	 */
	public function test_get_prepopulation_email_from_url_parameters() {
		$test_email = 'test@example.com';

		// Set up URL parameters
		$_GET['jetpack_protected_owner_email']  = $test_email;
		$_GET['jetpack_create_missing_account'] = '1';

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		$this->assertEquals( $test_email, $result );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );
	}

	/**
	 * Test get_prepopulation_email from URL parameters with invalid email.
	 */
	public function test_get_prepopulation_email_from_url_parameters_invalid_email() {
		// Set up URL parameters with invalid email
		$_GET['jetpack_protected_owner_email']  = 'invalid-email';
		$_GET['jetpack_create_missing_account'] = '1';

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		$this->assertFalse( $result );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );
	}

	/**
	 * Test get_prepopulation_email from URL parameters missing create_missing_account.
	 */
	public function test_get_prepopulation_email_from_url_parameters_missing_create_flag() {
		$test_email = 'test@example.com';

		// Set up URL parameters missing the create flag
		$_GET['jetpack_protected_owner_email'] = $test_email;

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		$this->assertFalse( $result );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
	}

	/**
	 * Test get_prepopulation_email from stored error data fallback.
	 */
	public function test_get_prepopulation_email_from_stored_error() {
		$test_email = 'test@example.com';

		// Set up an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		// Should now return false since stored error fallback was removed
		$this->assertFalse( $result );
	}

	/**
	 * Test get_prepopulation_email returns false when no email available.
	 */
	public function test_get_prepopulation_email_returns_false_when_no_email() {
		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		$this->assertFalse( $result );
	}

	/**
	 * Test get_prepopulation_email URL parameters take priority over stored error.
	 */
	public function test_get_prepopulation_email_url_parameters_take_priority() {
		$url_email    = 'url@example.com';
		$stored_email = 'stored@example.com';

		// Set up stored error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $stored_email,
			)
		);

		// Set up URL parameters (should work since only URL parameters are used)
		$_GET['jetpack_protected_owner_email']  = $url_email;
		$_GET['jetpack_create_missing_account'] = '1';

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_prepopulation_email' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->handler );

		$this->assertEquals( $url_email, $result );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );
	}

	/**
	 * Test prepopulate_user_form outputs expected HTML when email is available.
	 */
	public function test_prepopulate_user_form_with_email() {
		$test_email = 'test@example.com';

		// Set up URL parameters to ensure we have an email to prepopulate
		$_GET['jetpack_protected_owner_email']  = $test_email;
		$_GET['jetpack_create_missing_account'] = '1';

		// Capture output
		ob_start();
		$this->handler->prepopulate_user_form();
		$output = ob_get_clean();

		// Verify output contains expected elements
		$this->assertStringContainsString( $test_email, $output );
		$this->assertStringContainsString( 'jetpack_prepopulate_email', $output );
		$this->assertStringContainsString( 'jetpack_create_missing_account', $output );
		$this->assertStringContainsString( 'text/javascript', $output );
		$this->assertStringContainsString( 'getElementById', $output );
		$this->assertStringContainsString( 'administrator', $output );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );
	}

	/**
	 * Test prepopulate_user_form outputs nothing when no email is available.
	 */
	public function test_prepopulate_user_form_without_email() {
		// Capture output
		ob_start();
		$this->handler->prepopulate_user_form();
		$output = ob_get_clean();

		// Should be empty
		$this->assertEmpty( $output );
	}

	/**
	 * Test disable_wpcom_invite_for_protected_owner filter with protected owner context.
	 */
	public function test_disable_wpcom_invite_for_protected_owner_with_email() {
		$test_email = 'test@example.com';

		// Set up URL parameters to create protected owner context
		$_GET['jetpack_protected_owner_email']  = $test_email;
		$_GET['jetpack_create_missing_account'] = '1';

		// Test that the filter disables invitations
		$result = $this->handler->disable_wpcom_invite_for_protected_owner( true );
		$this->assertFalse( $result );

		// Test that it also works when the original value is false
		$result = $this->handler->disable_wpcom_invite_for_protected_owner( false );
		$this->assertFalse( $result );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );
	}

	/**
	 * Test disable_wpcom_invite_for_protected_owner filter without protected owner context.
	 */
	public function test_disable_wpcom_invite_for_protected_owner_without_email() {
		// Test that without protected owner context, original value is preserved
		$result = $this->handler->disable_wpcom_invite_for_protected_owner( true );
		$this->assertTrue( $result );

		$result = $this->handler->disable_wpcom_invite_for_protected_owner( false );
		$this->assertFalse( $result );
	}
}
