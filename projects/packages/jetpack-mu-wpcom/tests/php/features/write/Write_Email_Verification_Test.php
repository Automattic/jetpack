<?php
/**
 * Tests for the Write feature's email-verification launch gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/email-verification.php';

/**
 * Exercises the launch gate and its admin-ajax resend / re-check endpoints.
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
		unset( $_REQUEST['nonce'], $_POST['nonce'] );
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

	/**
	 * The resend endpoint asks Email_Verification to resend and reports success.
	 */
	public function test_resend_endpoint_resends_and_reports_success() {
		$this->set_valid_nonce();
		\Mockery::mock( 'alias:Email_Verification' )
			->shouldReceive( 'resend_verification_email' )
			->once();

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_resend_verification_email' );

		$this->assertTrue( $response['success'] );
	}

	/**
	 * The re-check endpoint reports verified=true once the email is confirmed.
	 */
	public function test_check_endpoint_reports_verified_when_confirmed() {
		$this->set_valid_nonce();
		\Mockery::mock( 'alias:Email_Verification' )
			->shouldReceive( 'is_email_unverified' )
			->andReturn( false );

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_check_email_verification' );

		$this->assertTrue( $response['success'] );
		$this->assertTrue( $response['data']['verified'] );
	}

	/**
	 * The re-check endpoint reports verified=false while the email is unverified,
	 * so a still-unverified author can't slip past to the launch flow.
	 */
	public function test_check_endpoint_reports_unverified_when_still_pending() {
		$this->set_valid_nonce();
		\Mockery::mock( 'alias:Email_Verification' )
			->shouldReceive( 'is_email_unverified' )
			->andReturn( true );

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_check_email_verification' );

		$this->assertTrue( $response['success'] );
		$this->assertFalse( $response['data']['verified'] );
	}

	/**
	 * Prime a valid nonce for the shared verification action.
	 */
	private function set_valid_nonce() {
		$nonce             = wp_create_nonce( WPCOM_WRITE_EMAIL_VERIFICATION_NONCE );
		$_REQUEST['nonce'] = $nonce;
		$_POST['nonce']    = $nonce;
	}

	/**
	 * Invoke an ajax handler and return its JSON envelope as an array.
	 *
	 * WordPress's wp_send_json_* echoes the response then calls wp_die(); force the
	 * ajax path and throw from the die handler so we can capture the buffered JSON
	 * without ending the test process.
	 *
	 * @param callable $handler Ajax handler to invoke.
	 * @return array<string, mixed> Decoded response.
	 */
	private function capture_ajax_json( $handler ) {
		add_filter( 'wp_doing_ajax', '__return_true' );
		add_filter(
			'wp_die_ajax_handler',
			function () {
				// Throw so wp_send_json_*'s wp_die() unwinds back to the test rather
				// than ending the process. A `never` return type would break PHP 7.2.
				// @phan-suppress-next-line PhanPluginNeverReturnFunction
				return function () {
					throw new \Exception( 'wp_die' );
				};
			}
		);

		ob_start();
		try {
			$handler();
		} catch ( \Exception $e ) {
			unset( $e ); // wp_die() from wp_send_json_*; expected.
		}
		$output = ob_get_clean();

		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );

		return json_decode( $output, true );
	}
}
