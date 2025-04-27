<?php
/**
 * User_Account_Status functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * User_Account_Status functionality testing.
 */
class User_Account_Status_Test extends TestCase {

	/**
	 * The current user ID.
	 *
	 * @var int|null
	 */
	private static $user_id;

	/**
	 * The admin user ID.
	 *
	 * @var int|null
	 */
	private static $admin_user_id;

	/**
	 * The User_Account_Status instance.
	 *
	 * @var User_Account_Status
	 */
	private $user_account_status;

	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	#[Before]
	public function set_up() {
		// Make sure WorDBless is initialized
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

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

		// Create an instance of the User_Account_Status class for testing
		$this->user_account_status = new User_Account_Status();

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
	#[After]
	public function tear_down() {
		// Reset current user
		wp_set_current_user( 0 );

		// Explicitly delete the users we created
		if ( self::$user_id ) {
			wp_delete_user( self::$user_id );
			self::$user_id = null;
		}

		if ( self::$admin_user_id ) {
			wp_delete_user( self::$admin_user_id );
			self::$admin_user_id = null;
		}

		// Also clean up any other users that might have been created
		$users = get_users();
		foreach ( $users as $user ) {
			if ( $user->ID > 0 ) {
				wp_delete_user( $user->ID );
			}
		}

		// Clean up transients
		delete_transient( 'jetpack_account_mismatch_' . md5( 'wpcom@example.com' ) );
		delete_transient( 'jetpack_account_mismatch_' . md5( 'another_wpcom@example.com' ) );
		delete_transient( 'jetpack_account_mismatch_' . md5( 'test_clean@example.com' ) );

		// Reset WorDBless state
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Test possible_account_mismatch with matching emails.
	 */
	public function test_possible_account_mismatch_with_matching_emails() {
		// When emails match, should return false
		$result = $this->user_account_status->possible_account_mismatch( 'same@example.com', 'same@example.com' );
		$this->assertFalse( $result );
	}

	/**
	 * Test possible_account_mismatch with empty WPCOM email.
	 */
	public function test_possible_account_mismatch_with_empty_wpcom_email() {
		// When WPCOM email is empty, should return false
		$result = $this->user_account_status->possible_account_mismatch( 'local@example.com', '' );
		$this->assertFalse( $result );
	}

	/**
	 * Test possible_account_mismatch with existing transient.
	 */
	public function test_possible_account_mismatch_with_existing_transient() {
		// When transient exists, should return the cached value (true in this case)
		$result = $this->user_account_status->possible_account_mismatch( 'local@example.com', 'wpcom@example.com' );
		$this->assertTrue( $result );
	}

	/**
	 * Test possible_account_mismatch with a local user having WPCOM email.
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

		// When a local user has the WPCOM email, should return true
		$result = $this->user_account_status->possible_account_mismatch( 'local@example.com', 'another_wpcom@example.com' );
		$this->assertTrue( $result );

		// Check that the result was saved in a transient
		$this->assertTrue(
			get_transient( 'jetpack_account_mismatch_' . md5( 'another_wpcom@example.com' ) )
		);
	}

	/**
	 * Test check_account_errors with no errors.
	 */
	public function test_check_account_errors_with_no_errors() {
		// Use same email to avoid mismatch (no errors)
		$result = $this->user_account_status->check_account_errors( 'same@example.com', 'same@example.com' );
		$this->assertEmpty( $result );
	}

	/**
	 * Test check_account_errors with mismatch error.
	 */
	public function test_check_account_errors_with_mismatch_error() {
		// Set up the transient to simulate a mismatch
		set_transient( 'jetpack_account_mismatch_' . md5( 'wpcom@example.com' ), true, DAY_IN_SECONDS );

		// This should return a mismatch error
		$result = $this->user_account_status->check_account_errors( 'local@example.com', 'wpcom@example.com' );

		// Verify we got the expected error
		$this->assertArrayHasKey( 'mismatch', $result );
		$this->assertEquals( 'mismatch', $result['mismatch']['type'] );
		$this->assertArrayHasKey( 'details', $result['mismatch'] );
		$this->assertEquals( 'local@example.com', $result['mismatch']['details']['site_email'] );
		$this->assertEquals( 'wpcom@example.com', $result['mismatch']['details']['wpcom_email'] );
	}

	/**
	 * Test the filter in check_account_errors.
	 */
	public function test_check_account_errors_filter() {
		// Add a test filter
		add_filter( 'jetpack_connection_account_errors', array( $this, 'add_test_error' ), 10, 3 );

		// Should have both the mismatch error and our test error
		$result = $this->user_account_status->check_account_errors( 'local@example.com', 'wpcom@example.com' );

		// Remove the filter
		remove_filter( 'jetpack_connection_account_errors', array( $this, 'add_test_error' ) );

		// Verify we have our test error
		$this->assertArrayHasKey( 'test_error', $result );
		$this->assertEquals( 'test', $result['test_error']['type'] );
	}

	/**
	 * Helper filter function to add a test error.
	 *
	 * @param array  $errors             The existing errors.
	 * @param string $current_user_email The current user email.
	 * @param string $wpcom_user_email   The WPCOM user email.
	 *
	 * @return array Modified errors.
	 */
	public function add_test_error( $errors, $current_user_email, $wpcom_user_email ) {
		$errors['test_error'] = array(
			'type'    => 'test',
			'message' => 'This is a test error',
			'details' => array(
				'site_email'  => $current_user_email,
				'wpcom_email' => $wpcom_user_email,
			),
		);
		return $errors;
	}

	/**
	 * Test clean_account_mismatch_transients method with email.
	 */
	public function test_clean_account_mismatch_transients_with_email() {
		// Set up a test transient
		$email         = 'test_clean@example.com';
		$transient_key = 'jetpack_account_mismatch_' . md5( $email );
		set_transient( $transient_key, true, DAY_IN_SECONDS );

		// Verify it exists
		$this->assertTrue( false !== get_transient( $transient_key ) );

		// Clean it
		$this->user_account_status->clean_account_mismatch_transients( $email );

		// Verify it's gone
		$this->assertFalse( get_transient( $transient_key ) );
	}

	/**
	 * Test clean_account_mismatch_transients method with user ID.
	 */
	public function test_clean_account_mismatch_transients_with_user_id() {
		// Set up a test transient
		$user          = get_userdata( self::$user_id );
		$email         = $user->user_email;
		$transient_key = 'jetpack_account_mismatch_' . md5( $email );
		set_transient( $transient_key, true, DAY_IN_SECONDS );

		// Verify it exists
		$this->assertTrue( false !== get_transient( $transient_key ) );

		// Clean it using user ID
		$this->user_account_status->clean_account_mismatch_transients( self::$user_id );

		// Verify it's gone
		$this->assertFalse( get_transient( $transient_key ) );
	}

	/**
	 * Test clean_account_mismatch_transients with invalid inputs.
	 */
	public function test_clean_account_mismatch_transients_with_invalid_inputs() {
		// Non-existent user ID
		$this->user_account_status->clean_account_mismatch_transients( 99999 );

		// Invalid email
		$this->user_account_status->clean_account_mismatch_transients( 'not-an-email' );

		// Empty string
		$this->user_account_status->clean_account_mismatch_transients( '' );

		// Verify the function doesn't throw errors with invalid inputs
		$this->assertTrue( true );
	}
}
