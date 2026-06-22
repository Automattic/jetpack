<?php
/**
 * Test for Brute Force Protection class.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\BackupGlobals;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Brute Force Protection test case.
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */ ]
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
	 * Clean up each test.
	 */
	public function tearDown(): void {
		delete_site_option( 'jetpack_protect_activating' );
		delete_site_option( 'jetpack_protect_key' );

		parent::tearDown();
	}

	/**
	 * Test that log_successful_login still calls protect_call when get_user_by returns false.
	 */
	public function test_log_successful_login_handles_unknown_user() {
		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'successful_login', array( 'roles' => array() ) );

		// 'nonexistent-user' has no corresponding DB row, so get_user_by() returns false.
		$this->instance->log_successful_login( 'nonexistent-user' );
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

	/**
	 * Test that maybe_get_protect_key keeps the activation flag when key generation fails.
	 */
	public function test_maybe_get_protect_key_keeps_activating_flag_after_failure() {
		update_site_option( 'jetpack_protect_activating', 'activating' );
		delete_site_option( 'jetpack_protect_key' );

		$instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_protect_key' ) )
			->getMock();

		$instance->expects( $this->once() )
			->method( 'get_protect_key' )
			->willReturn( false );

		$this->assertFalse( $instance->maybe_get_protect_key() );
		$this->assertSame( 'activating', get_site_option( 'jetpack_protect_activating' ) );
	}

	/**
	 * Test that maybe_get_protect_key clears the activation flag after successful key generation.
	 */
	public function test_maybe_get_protect_key_clears_activating_flag_after_success() {
		update_site_option( 'jetpack_protect_activating', 'activating' );
		delete_site_option( 'jetpack_protect_key' );

		$instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_protect_key' ) )
			->getMock();

		$instance->expects( $this->once() )
			->method( 'get_protect_key' )
			->willReturn( 'generated-protect-key' );

		$this->assertSame( 'generated-protect-key', $instance->maybe_get_protect_key() );
		$this->assertFalse( get_site_option( 'jetpack_protect_activating', false ) );
	}

	/**
	 * Test that maybe_get_protect_key returns an existing key without requesting a new one.
	 */
	public function test_maybe_get_protect_key_returns_existing_key_without_retrying() {
		update_site_option( 'jetpack_protect_activating', 'activating' );
		update_site_option( 'jetpack_protect_key', 'existing-protect-key' );

		$instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_protect_key' ) )
			->getMock();

		$instance->expects( $this->never() )
			->method( 'get_protect_key' );

		$this->assertSame( 'existing-protect-key', $instance->maybe_get_protect_key() );
		$this->assertSame( 'activating', get_site_option( 'jetpack_protect_activating' ) );
	}

	/**
	 * Test that get_local_host handles wp_parse_url returning false.
	 *
	 * @backupGlobals enabled
	 */
	#[BackupGlobals( true )]
	public function test_get_local_host_handles_wp_parse_url_false() {
		$_SERVER['HTTP_HOST'] = '';

		$result = $this->instance->get_local_host();

		$this->assertIsString( $result );
		$this->assertNotEmpty( $result );
	}

	/**
	 * Verifies that the transient value is not acted upon (decremented) if the transient value was indeed not set.
	 *
	 * @backupGlobals enabled
	 */
	#[BackupGlobals( true )]
	public function test_log_failed_attempt_does_not_emit_warning_when_transient_not_set() {
		$error = new WP_Error( 'incorrect_password', 'Incorrect password' );

		$this->instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'protect_call', 'get_transient' ) )
			->getMock();

		$this->instance->method( 'protect_call' )->willReturn( array() );
		$this->instance->method( 'get_transient' )->willReturn( false );

		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'failed_attempt' );

		$_COOKIE['jpp_math_pass'] = 1;
		$this->instance->log_failed_attempt( 'username', $error );
	}

	/**
	 * Verifies that the transient value is not acted upon (decremented) if the transient value was not an integer.
	 *
	 * @backupGlobals enabled
	 * @dataProvider non_integer_data_provider
	 */
	#[BackupGlobals( true )]
	#[DataProvider( 'non_integer_data_provider' )]
	public function test_log_failed_attempt_does_not_emit_warning_when_transient_not_integer( $non_integer ) {
		$error = new WP_Error( 'incorrect_password', 'Incorrect password' );

		$this->instance = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'protect_call', 'get_transient' ) )
			->getMock();

		$this->instance->method( 'protect_call' )->willReturn( array() );
		$this->instance->method( 'get_transient' )->willReturn( $non_integer );

		$this->instance->expects( $this->once() )
			->method( 'protect_call' )
			->with( 'failed_attempt' );

		$_COOKIE['jpp_math_pass'] = 1;
		$this->instance->log_failed_attempt( 'username', $error );
	}

	public static function non_integer_data_provider(): array {
		return array(
			array( true ),
			array( null ),
			array( 3.14 ),
			array( array( 'hello' ) ),
			array( 'some-string' ),
			array( (object) array() ),
		);
	}
}
