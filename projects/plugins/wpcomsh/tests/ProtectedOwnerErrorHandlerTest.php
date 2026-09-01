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
	 * Test build_error_data method.
	 */
	public function test_build_error_data() {
		$raw_error = array(
			'error_type' => 'missing_owner',
			'email'      => 'test@example.com',
		);

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'build_error_data' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $raw_error );

		$this->assertIsArray( $result );
		$this->assertEquals( 'create_missing_account', $result['action'] );
		$this->assertEquals( 'test@example.com', $result['email'] );
		$this->assertEquals( 'missing_owner', $result['error_type'] );
		$this->assertArrayHasKey( 'blog_id', $result );
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
	 * Test handle_error method clears error when not on Atomic.
	 *
	 * When Atomic_Persistent_Data class doesn't exist, we're not on Atomic
	 * and the error should be cleared.
	 */
	public function test_handle_error_clears_error_when_not_on_atomic() {
		// This test verifies the behavior when APD class doesn't exist
		// In the test environment, APD typically exists, so we can only verify
		// the logic through the code path that checks class_exists
		if ( class_exists( \Atomic_Persistent_Data::class ) ) {
			$this->markTestSkipped( 'Test requires Atomic_Persistent_Data class to NOT exist.' );
		}

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

		// Error should be cleared when not on Atomic
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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

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

	/**
	 * Test get_protected_owner_status returns no_match when APD class doesn't exist.
	 */
	public function test_get_protected_owner_status_no_apd_class() {
		// Skip if APD class exists (we can't test the "no class" scenario)
		if ( class_exists( \Atomic_Persistent_Data::class ) ) {
			$this->markTestSkipped( 'Test requires Atomic_Persistent_Data class to NOT exist.' );
		}

		$user_id = $this->factory()->user->create( array( 'user_email' => 'test@example.com' ) );

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_protected_owner_status' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $user_id );

		$this->assertEquals( 'no_match', $result['match_type'] );
		$this->assertNull( $result['owner_email'] );
	}

	/**
	 * Test get_protected_owner_status returns no_match for non-existent user.
	 */
	public function test_get_protected_owner_status_nonexistent_user() {
		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'get_protected_owner_status' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// Use a user ID that doesn't exist
		$result = $method->invoke( $this->handler, 999999 );

		$this->assertEquals( 'no_match', $result['match_type'] );
	}

	/**
	 * Test user_has_owner_token returns false when Jetpack_Options class doesn't exist.
	 */
	public function test_user_has_owner_token_no_jetpack_options() {
		// Skip if Jetpack_Options exists (most test environments have it)
		if ( class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Test requires Jetpack_Options class to NOT exist.' );
		}

		$user_id = $this->factory()->user->create();

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'user_has_owner_token' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $user_id, 'some.secret' );

		$this->assertFalse( $result );
	}

	/**
	 * Test user_has_owner_token returns false when user has no token.
	 */
	public function test_user_has_owner_token_no_token() {
		// Skip if Jetpack_Options doesn't exist
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Test requires Jetpack_Options class.' );
		}

		$user_id = $this->factory()->user->create();

		// Ensure no tokens are set for this user
		$private_options                = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
		$private_options['user_tokens'] = array();
		\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options, false );

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'user_has_owner_token' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $user_id, 'some.secret' );

		$this->assertFalse( $result );
	}

	/**
	 * Test user_has_owner_token returns true when token matches.
	 */
	public function test_user_has_owner_token_matching_token() {
		// Skip if Jetpack_Options doesn't exist
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Test requires Jetpack_Options class.' );
		}

		$user_id      = $this->factory()->user->create();
		$owner_secret = 'token_key.secret_value';
		$user_token   = $owner_secret . '.' . $user_id; // token_key.secret_value.user_id

		// Set the user token
		$private_options                            = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
		$private_options['user_tokens']             = array();
		$private_options['user_tokens'][ $user_id ] = $user_token;
		\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options, false );

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'user_has_owner_token' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $user_id, $owner_secret );

		$this->assertTrue( $result );

		// Clean up
		$private_options['user_tokens'] = array();
		\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options, false );
	}

	/**
	 * Test user_has_owner_token returns false when token doesn't match.
	 */
	public function test_user_has_owner_token_non_matching_token() {
		// Skip if Jetpack_Options doesn't exist
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Test requires Jetpack_Options class.' );
		}

		$user_id      = $this->factory()->user->create();
		$owner_secret = 'token_key.secret_value';
		$user_token   = 'different_key.different_secret.' . $user_id;

		// Set a different user token
		$private_options                            = \Jetpack_Options::get_raw_option( 'jetpack_private_options', array() );
		$private_options['user_tokens']             = array();
		$private_options['user_tokens'][ $user_id ] = $user_token;
		\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options, false );

		// Use reflection to access private method
		$reflection = new ReflectionClass( $this->handler );
		$method     = $reflection->getMethod( 'user_has_owner_token' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $this->handler, $user_id, $owner_secret );

		$this->assertFalse( $result );

		// Clean up
		$private_options['user_tokens'] = array();
		\Jetpack_Options::update_raw_option( 'jetpack_private_options', $private_options, false );
	}

	/**
	 * Test add_owner_email_warning outputs nothing when user is not protected owner.
	 */
	public function test_add_owner_email_warning_not_protected_owner() {
		// Create a regular user
		$user_id         = $this->factory()->user->create( array( 'user_email' => 'regular@example.com' ) );
		$_GET['user_id'] = $user_id;

		// Capture output
		ob_start();
		$this->handler->add_owner_email_warning();
		$output = ob_get_clean();

		// Should be empty since user is not the protected owner
		$this->assertEmpty( $output );

		// Clean up
		unset( $_GET['user_id'] );
	}
}
