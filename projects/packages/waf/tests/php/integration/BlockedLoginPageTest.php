<?php
/**
 * Tests for the blocked login page.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Blocked_Login_Page;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Blocked login page test case.
 */
class BlockedLoginPageTest extends WorDBless\BaseTestCase {

	/**
	 * Clean up each test.
	 */
	public function tearDown(): void {
		unset( $_POST['email'] );
		remove_all_filters( 'pre_http_request' );

		parent::tearDown();
	}

	/**
	 * Create a user with the given activation key and password nag.
	 *
	 * @param string $activation_key The user_activation_key value.
	 * @param bool   $nag            The default_password_nag value.
	 *
	 * @return WP_User
	 */
	private function create_user( $activation_key, $nag ) {
		$user_id = wp_insert_user(
			array(
				'user_login'          => 'blocked-user',
				'user_email'          => 'blocked-user@example.com',
				'user_pass'           => 'password',
				'user_activation_key' => $activation_key,
			)
		);
		update_user_meta( $user_id, 'default_password_nag', $nag );

		return get_userdata( $user_id );
	}

	/**
	 * Data provider for test_user_has_unfinished_registration.
	 *
	 * @return array
	 */
	public static function provide_registration_states() {
		return array(
			'registered, set-password link unused' => array( '1700000000:hash', true, true ),
			'password set, mid lost-password flow' => array( '1700000000:hash', false, false ),
			'registered, logged in since'          => array( '', true, false ),
			'password set'                         => array( '', false, false ),
		);
	}

	/**
	 * Test detection of users who never used their set-password link.
	 *
	 * @dataProvider provide_registration_states
	 *
	 * @param string $activation_key The user_activation_key value.
	 * @param bool   $nag            The default_password_nag value.
	 * @param bool   $expected       Expected result.
	 */
	#[DataProvider( 'provide_registration_states' )]
	public function test_user_has_unfinished_registration( $activation_key, $nag, $expected ) {
		$page = new Waf_Blocked_Login_Page( '1.2.3.4' );

		$this->assertSame( $expected, $page->user_has_unfinished_registration( $this->create_user( $activation_key, $nag ) ) );
	}

	/**
	 * Test that no recovery email is requested for a user who never set a password.
	 */
	public function test_send_recovery_email_skips_unfinished_registration() {
		$this->create_user( '1700000000:hash', true );
		$_POST['email'] = 'blocked-user@example.com';

		$requested = false;
		add_filter(
			'pre_http_request',
			function () use ( &$requested ) {
				$requested = true;
				return new WP_Error( 'blocked', 'No HTTP in tests.' );
			}
		);

		$page   = new Waf_Blocked_Login_Page( '1.2.3.4' );
		$result = $page->send_recovery_email();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'password_not_set', $result->get_error_code() );
		$this->assertFalse( $requested );
	}
}
