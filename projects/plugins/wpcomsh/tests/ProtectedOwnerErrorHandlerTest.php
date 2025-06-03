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
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test handle_error returns original errors for invalid data.
	 */
	public function test_handle_error_returns_original_errors_for_invalid_data() {
		$original_errors = array( 'some_error' => array( '1' => array( 'data' => 'test' ) ) );

		// Test with non-array data
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, 'invalid_data' );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( array(), $result );

		// Test with missing error_type
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'email' => 'test@example.com' ) );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( array(), $result );

		// Test with missing email
		update_option( Protected_Owner_Error_Handler::STORED_ERRORS_OPTION, array( 'error_type' => 'missing_owner' ) );
		$result = $this->handler->handle_error( $original_errors );
		$this->assertEquals( array(), $result );
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

		// Should return empty array and delete the stored error
		$this->assertEquals( array(), $result );
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
		$this->assertEquals( 'create_missing_account', $error_data['error_data']['action'] );
		$this->assertStringContainsString( 'user-new.php', $error_data['error_data']['support_url'] );
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

		$this->assertEquals( $test_email, $result );
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

		// Set up URL parameters (should take priority)
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
	 * Test enqueue_form_scripts only enqueues on user-new.php page.
	 */
	public function test_enqueue_form_scripts_only_on_user_new_page() {
		$test_email = 'test@example.com';

		// Set up an error to ensure we have an email to prepopulate
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		// Test with correct hook
		$this->handler->enqueue_form_scripts( 'user-new.php' );
		$this->assertTrue( wp_script_is( 'jquery', 'enqueued' ) );

		// Reset
		wp_dequeue_script( 'jquery' );

		// Test with incorrect hook - should not enqueue
		$this->handler->enqueue_form_scripts( 'plugins.php' );
		$this->assertFalse( wp_script_is( 'jquery', 'enqueued' ) );
	}

	/**
	 * Test enqueue_form_scripts doesn't enqueue without email.
	 */
	public function test_enqueue_form_scripts_no_email() {
		// Test without any email available
		$this->handler->enqueue_form_scripts( 'user-new.php' );
		$this->assertFalse( wp_script_is( 'jquery', 'enqueued' ) );
	}

	/**
	 * Test prepopulate_user_form outputs expected HTML when email is available.
	 */
	public function test_prepopulate_user_form_with_email() {
		$test_email = 'test@example.com';

		// Set up an error
		update_option(
			Protected_Owner_Error_Handler::STORED_ERRORS_OPTION,
			array(
				'error_type' => 'missing_owner',
				'email'      => $test_email,
			)
		);

		// Capture output
		ob_start();
		$this->handler->prepopulate_user_form();
		$output = ob_get_clean();

		// Verify output contains expected elements
		$this->assertStringContainsString( 'Jetpack Connection Owner', $output );
		$this->assertStringContainsString( $test_email, $output );
		$this->assertStringContainsString( 'jetpack_prepopulate_email', $output );
		$this->assertStringContainsString( 'jetpack_create_missing_account', $output );
		$this->assertStringContainsString( 'text/javascript', $output );
		$this->assertStringContainsString( '#email', $output );
		$this->assertStringContainsString( '#invite_user_wpcom', $output );
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
	 * Test override_wpcom_invite_checkbox only works for add-new-user type.
	 */
	public function test_override_wpcom_invite_checkbox_type_check() {
		$test_email = 'test@example.com';

		// Set up URL parameters
		$_GET['jetpack_protected_owner_email']  = $test_email;
		$_GET['jetpack_create_missing_account'] = '1';

		// Test with wrong type - should return early
		$this->handler->override_wpcom_invite_checkbox( 'wrong-type' );

		// Test with correct type - should proceed (we can't easily test the hook removal in unit tests)
		$this->handler->override_wpcom_invite_checkbox( 'add-new-user' );

		// Clean up
		unset( $_GET['jetpack_protected_owner_email'] );
		unset( $_GET['jetpack_create_missing_account'] );

		// This test mainly verifies the method doesn't throw errors
		$this->assertTrue( true );
	}

	/**
	 * Test override_wpcom_invite_checkbox returns early without email.
	 */
	public function test_override_wpcom_invite_checkbox_without_email() {
		// Should return early without any email available
		$this->handler->override_wpcom_invite_checkbox( 'add-new-user' );

		// This test mainly verifies the method doesn't throw errors
		$this->assertTrue( true );
	}

	/**
	 * Test render_unchecked_wpcom_invite_checkbox outputs expected HTML.
	 */
	public function test_render_unchecked_wpcom_invite_checkbox() {
		// Capture output
		ob_start();
		$this->handler->render_unchecked_wpcom_invite_checkbox( 'add-new-user' );
		$output = ob_get_clean();

		// Verify output contains expected elements
		$this->assertStringContainsString( 'invite_user_wpcom', $output );
		$this->assertStringContainsString( 'Invite user', $output );
		$this->assertStringContainsString( 'Invite user to WordPress.com', $output );
		$this->assertStringContainsString( 'checkbox', $output );
		$this->assertStringContainsString( 'Jetpack connection issue', $output );

		// Verify checkbox is not checked (should not contain 'checked')
		$this->assertStringNotContainsString( 'checked', $output );
	}

	/**
	 * Test render_unchecked_wpcom_invite_checkbox only works for add-new-user type.
	 */
	public function test_render_unchecked_wpcom_invite_checkbox_type_check() {
		// Capture output with wrong type
		ob_start();
		$this->handler->render_unchecked_wpcom_invite_checkbox( 'wrong-type' );
		$output = ob_get_clean();

		// Should be empty
		$this->assertEmpty( $output );
	}
}
