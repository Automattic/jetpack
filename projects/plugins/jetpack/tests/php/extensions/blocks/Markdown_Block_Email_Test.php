<?php
/**
 * Markdown Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/mocks/class-mock-woocommerce-fallback-renderer.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/markdown/markdown.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * @covers ::Automattic\Jetpack\Extensions\Markdown\make_content_email_safe
 * @covers ::Automattic\Jetpack\Extensions\Markdown\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Markdown\make_content_email_safe' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Markdown\render_email' )]
class Markdown_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A word no email client can break on whitespace, which is what widens the email.
	 */
	const UNBREAKABLE_WORD = 'EACMP_BREAKING_UNRECOVERABLE_INVARIANT_WITH_A_NAME_FAR_WIDER_THAN_THE_EMAIL';

	/**
	 * Test table cells wrap.
	 */
	public function test_table_cells_wrap() {
		$html = Automattic\Jetpack\Extensions\Markdown\make_content_email_safe(
			'<table><thead><tr><th>Guard reason</th></tr></thead><tbody><tr><td>' . self::UNBREAKABLE_WORD . '</td></tr></tbody></table>'
		);

		$this->assertStringContainsString( '<th style="word-break: break-word;">', $html );
		$this->assertStringContainsString( '<td style="word-break: break-word;">', $html );
	}

	/**
	 * Test a code fence wraps and keeps its line breaks.
	 */
	public function test_code_fence_wraps_and_keeps_line_breaks() {
		$html = Automattic\Jetpack\Extensions\Markdown\make_content_email_safe(
			'<pre><code>first line' . "\n\t" . self::UNBREAKABLE_WORD . '</code></pre>'
		);

		$this->assertStringContainsString( 'white-space: pre-wrap; word-break: break-word;', $html );
		$this->assertStringContainsString( "first line\n\t" . self::UNBREAKABLE_WORD, $html );
	}

	/**
	 * Test a style the author already set survives.
	 */
	public function test_existing_style_is_kept() {
		$html = Automattic\Jetpack\Extensions\Markdown\make_content_email_safe( '<table><tr><td style="text-align: right">Total</td></tr></table>' );

		$this->assertStringContainsString( 'text-align: right; word-break: break-word;', $html );
	}

	/**
	 * Test tags that never caused the overflow are left alone.
	 */
	public function test_other_tags_are_untouched() {
		$markup = '<div class="wp-block-jetpack-markdown"><p>Lab notes</p><ul><li>One</li></ul></div>';

		$this->assertSame( $markup, Automattic\Jetpack\Extensions\Markdown\make_content_email_safe( $markup ) );
	}

	/**
	 * Test the wrapped content is what reaches the email engine's renderer.
	 */
	public function test_render_email_hands_wrapped_content_to_the_renderer() {
		$rendered = Automattic\Jetpack\Extensions\Markdown\render_email(
			'<table><tr><td>' . self::UNBREAKABLE_WORD . '</td></tr></table>',
			array(),
			new stdClass()
		);

		$this->assertStringContainsString( '<td style="word-break: break-word;">' . self::UNBREAKABLE_WORD . '</td>', (string) $rendered );
	}
}
