<?php
/**
 * Email Utils tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/shared/email-utils.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for the shared email utility functions.
 *
 * @covers ::Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding' )]
class Email_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that horizontal padding is applied when email_attrs contains padding values.
	 */
	public function test_apply_email_horizontal_padding_with_padding() {
		$html        = '<table><tr><td>Content</td></tr></table>';
		$email_attrs = array(
			'padding-left'  => '20px',
			'padding-right' => '20px',
		);

		$result = \Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding( $html, $email_attrs );

		$this->assertStringContainsString( 'padding-left', $result );
		$this->assertStringContainsString( 'padding-right', $result );
		$this->assertStringContainsString( '20px', $result );
		$this->assertStringContainsString( '<div style="', $result );
		$this->assertStringContainsString( $html, $result );
	}

	/**
	 * Test that HTML is returned unchanged when email_attrs is empty.
	 */
	public function test_apply_email_horizontal_padding_with_empty_attrs() {
		$html = '<table><tr><td>Content</td></tr></table>';

		$result = \Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding( $html, array() );

		$this->assertSame( $html, $result );
	}

	/**
	 * Test that HTML is returned unchanged when email_attrs has no padding keys.
	 */
	public function test_apply_email_horizontal_padding_with_no_padding_keys() {
		$html        = '<table><tr><td>Content</td></tr></table>';
		$email_attrs = array(
			'margin' => '16px 0',
		);

		$result = \Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding( $html, $email_attrs );

		$this->assertSame( $html, $result );
	}

	/**
	 * Test that only padding-left is applied when only it is present.
	 */
	public function test_apply_email_horizontal_padding_with_only_left() {
		$html        = '<div>Content</div>';
		$email_attrs = array(
			'padding-left' => '15px',
		);

		$result = \Automattic\Jetpack\Extensions\Shared\apply_email_horizontal_padding( $html, $email_attrs );

		$this->assertStringContainsString( 'padding-left', $result );
		$this->assertStringNotContainsString( 'padding-right', $result );
		$this->assertStringContainsString( '<div style="', $result );
	}
}
