<?php
/**
 * Tests for the Write feature's email-verification launch gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/email-verification.php';

/**
 * Exercises wpcom_write_launch_blocked_for_unverified_email().
 */
class Write_Email_Verification_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_option( 'site_creation_flow' );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * On a Write On site, an unverified email blocks the launch.
	 */
	public function test_blocked_when_email_unverified_on_write_on_site() {
		update_option( 'site_creation_flow', 'write-on' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( true );

		$this->assertTrue( wpcom_write_launch_blocked_for_unverified_email() );
	}

	/**
	 * On a Write On site, a verified email leaves the launch unblocked.
	 */
	public function test_not_blocked_when_email_verified() {
		update_option( 'site_creation_flow', 'write-on' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( false );

		$this->assertFalse( wpcom_write_launch_blocked_for_unverified_email() );
	}

	/**
	 * A site not created via the Write On flow is never gated, even if the email
	 * is unverified — this mirrors the back-end launch gate's scoping.
	 */
	public function test_not_blocked_on_non_write_on_site() {
		update_option( 'site_creation_flow', 'onboarding' );
		\Mockery::mock( 'alias:Email_Verification' )->shouldReceive( 'is_email_unverified' )->andReturn( true );

		$this->assertFalse( wpcom_write_launch_blocked_for_unverified_email() );
	}
}
