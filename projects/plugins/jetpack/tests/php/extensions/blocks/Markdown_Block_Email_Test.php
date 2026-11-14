<?php
/**
 * Markdown Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/markdown/markdown.php';

use Automattic\Jetpack\Extensions\Markdown;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers ::Automattic\Jetpack\Extensions\Markdown\make_content_email_safe
 * @covers ::Automattic\Jetpack\Extensions\Markdown\register_block
 * @covers ::Automattic\Jetpack\Extensions\Markdown\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Markdown\make_content_email_safe' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Markdown\register_block' )]
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

		$this->assertStringContainsString( '<th style="word-break: break-word; min-width: 3em;">', $html );
		$this->assertStringContainsString( '<td style="word-break: break-word; min-width: 3em;">', $html );
	}

	/**
	 * Test a short label column keeps a readable width beside a long one, instead of being
	 * squeezed to the single character that word-break allows.
	 */
	public function test_narrow_cells_keep_a_floor() {
		$html = Automattic\Jetpack\Extensions\Markdown\make_content_email_safe(
			'<table><thead><tr><th>Code</th><th>Value</th></tr></thead><tbody><tr><td>GR-1</td><td>' . self::UNBREAKABLE_WORD . '</td></tr></tbody></table>'
		);

		$this->assertSame( 4, substr_count( $html, 'min-width: 3em;' ) );
	}

	/**
	 * Test the floor every cell carries stays small enough that a table of short columns,
	 * which fitted before the floor existed, still fits the email.
	 */
	public function test_the_cell_floor_leaves_room_for_several_columns() {
		$html = Automattic\Jetpack\Extensions\Markdown\make_content_email_safe(
			'<table><thead><tr><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr></thead>'
			. '<tbody><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr></tbody></table>'
		);

		preg_match_all( '/min-width: (\\d+)em;/', $html, $matches );
		$this->assertCount( 10, $matches[1], 'Every cell should carry the floor.' );

		// A 390px phone, less the email's 24px of root padding either side, leaves 342px. Measure
		// against that rather than the 612px desktop width, which is wide enough to accept a floor
		// that overflows a phone.
		$columns      = 5;
		$mobile_width = 342;
		$width        = static function ( $em ) use ( $columns ) {
			// Each cell adds 8px of padding either side, and collapsed borders add one per column
			// plus one.
			return $columns * ( $em * 16 + 16 ) + $columns + 1;
		};

		$this->assertLessThanOrEqual(
			$mobile_width,
			$width( (int) $matches[1][0] ),
			'The floor must leave a table of short columns inside the width a phone gives it.'
		);

		// The floor this replaced cleared the desktop width and still overflowed a phone, which is
		// what makes the limit above worth asserting.
		$this->assertGreaterThan( $mobile_width, $width( 4 ) );
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

		$this->assertStringContainsString( 'text-align: right; word-break: break-word; min-width: 3em;', $html );
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
		require_once __DIR__ . '/mocks/class-mock-woocommerce-fallback-renderer.php';

		$rendered = Automattic\Jetpack\Extensions\Markdown\render_email(
			'<table><tr><td>' . self::UNBREAKABLE_WORD . '</td></tr></table>',
			array(),
			new stdClass()
		);

		$this->assertStringContainsString( '<td style="word-break: break-word; min-width: 3em;">' . self::UNBREAKABLE_WORD . '</td>', (string) $rendered );
	}

	/**
	 * Test the block defers to the email engine when the e-mail editor is not installed,
	 * instead of fataling on a class that isn't there.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_render_email_defers_when_the_email_editor_is_absent() {
		$this->assertFalse(
			class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Fallback' ),
			'This test is only meaningful in a process where the renderer mock was never loaded.'
		);

		$this->assertNull( Markdown\render_email( '<table><tr><td>Cell</td></tr></table>', array(), new stdClass() ) );
	}

	/**
	 * Test the block registers the e-mail renderer, which is what routes it away from the
	 * engine's generic fallback.
	 */
	public function test_block_registers_the_email_renderer() {
		$registry = WP_Block_Type_Registry::get_instance();
		if ( $registry->is_registered( 'jetpack/markdown' ) ) {
			$registry->unregister( 'jetpack/markdown' );
		}

		Markdown\register_block();

		$block_type = $registry->get_registered( 'jetpack/markdown' );
		$this->assertInstanceOf( WP_Block_Type::class, $block_type );
		$this->assertSame(
			'Automattic\\Jetpack\\Extensions\\Markdown\\render_email',
			$block_type->render_email_callback
		);
	}
}
