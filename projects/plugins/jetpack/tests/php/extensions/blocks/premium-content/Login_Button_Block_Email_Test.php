<?php
/**
 * Premium Content Login Button Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/login-button/login-button.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Premium Content Login Button Block Email Rendering tests.
 *
 * These tests verify the render_login_button_block_email function works correctly.
 * The login button should not be rendered in emails since the subscriber is already
 * considered logged in when receiving emails.
 *
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block_email' )]
class Login_Button_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test render_login_button_block_email returns empty string.
	 *
	 * The login button should not be rendered in emails because the subscriber
	 * is already considered logged in when receiving emails.
	 */
	public function test_render_login_button_block_email_returns_empty_string() {
		$result = \Automattic\Jetpack\Extensions\Premium_Content\render_login_button_block_email();

		$this->assertSame( '', $result );
	}
}
