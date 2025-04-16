<?php
/**
 * Test for Brute Force Protection class.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;

/**
 * Brute Force Protection test case.
 */
class BruteForceProtectionTest extends WorDBless\BaseTestCase {

	/**
	 * Test instance.
	 *
	 * @var Brute_Force_Protection|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $instance;

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'protect_call', 'get_transient' ) )
			->getMock();

		// Configure the mocked methods to do nothing or return simple values.
		$this->instance->method( 'protect_call' )->willReturn( array() );
		$this->instance->method( 'get_transient' )->willReturn( 3 );
	}

	/**
	 * Test that log_failed_attempt can handle null usernames.
	 */
	public function test_log_failed_attempt_handles_null_username() {
		// Ensure no errors are triggered when null is passed as username.
		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'failed_attempt' );

		$this->instance->log_failed_attempt( null );
	}

	/**
	 * Test that log_failed_attempt can handle string error messages.
	 */
	public function test_log_failed_attempt_handles_string_error() {
		// Ensure no errors are triggered when a string is passed as error.
		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'failed_attempt' );

		$this->instance->log_failed_attempt( 'username', 'Invalid password' );
	}

	/**
	 * Test that log_failed_attempt properly handles WP_Error objects with password validation errors.
	 */
	public function test_log_failed_attempt_handles_password_validation_error() {
		$error = new WP_Error( 'password_detection_validation_error', 'Password validation error' );

		// Method should return early and not call protect_call.
		$this->instance->expects( $this->never() )
			->method( 'protect_call' );

		$this->instance->log_failed_attempt( 'username', $error );
	}

	/**
	 * Test that log_failed_attempt properly handles WP_Error objects with other errors.
	 */
	public function test_log_failed_attempt_handles_wp_error() {
		$error = new WP_Error( 'incorrect_password', 'Incorrect password' );

		// Method should process the failed attempt.
		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'failed_attempt' );

		$this->instance->log_failed_attempt( 'username', $error );
	}
}
