<?php
/**
 * Testing functions in Automattic\Jetpack\Connection\SSO\Notices class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\SSO;

use WorDBless\BaseTestCase;

/**
 * SSO Notices test suite.
 */
class Notices_Test extends BaseTestCase {

	/**
	 * Test that the two-step notice names the WordPress.com account that is logged in.
	 */
	public function test_error_msg_enable_two_step_names_the_wpcom_account() {
		$user_data = (object) array(
			'login'        => 'ana',
			'display_name' => '<b>Ana</b>',
		);

		$message = Notices::error_msg_enable_two_step( '', $user_data );

		$this->assertStringContainsString( '&lt;b&gt;Ana&lt;/b&gt;', $message );
		$this->assertStringContainsString( 'source=calypso-me-security-two-step', $message );
	}

	/**
	 * Test that the two-step notice falls back to the login when the display name is empty.
	 */
	public function test_error_msg_enable_two_step_falls_back_to_login() {
		$user_data = (object) array(
			'login'        => 'ana',
			'display_name' => '',
		);

		$message = Notices::error_msg_enable_two_step( '', $user_data );

		$this->assertStringContainsString( '<strong>ana</strong>', $message );
	}

	/**
	 * Test that the two-step notice still links to setup without account data.
	 */
	public function test_error_msg_enable_two_step_without_account_data() {
		$message = Notices::error_msg_enable_two_step( 'existing' );

		$this->assertStringStartsWith( 'existing', $message );
		$this->assertStringNotContainsString( '<strong>', $message );
		$this->assertStringContainsString( 'source=calypso-me-security-two-step', $message );
	}
}
