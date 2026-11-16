<?php
/**
 * Tests for the WPCom_Markdown class.
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/markdown/easy-markdown.php';

/**
 * @group markdown
 * @covers WPCom_Markdown
 */
#[Group( 'markdown' )]
#[CoversClass( WPCom_Markdown::class )]
class Easy_Markdown_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The parser's constructor runs `jetpack_markdown_preserve_shortcodes`, so a kses call there
	 * stands in for the translation filters that run kses while the parser loads.
	 */
	public function test_wp_kses_allowed_html_skips_while_parser_loads() {
		$parser = new ReflectionProperty( WPCom_Markdown::class, 'parser' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$parser->setAccessible( true );
		}
		$original = $parser->getValue();
		$parser->setValue( null, null );

		$markdown = WPCom_Markdown::get_instance();
		$calls    = 0;
		$nested   = null;
		add_filter(
			'jetpack_markdown_preserve_shortcodes',
			function ( $preserve ) use ( $markdown, &$calls, &$nested ) {
				if ( 1 === ++$calls ) {
					$nested = $markdown->wp_kses_allowed_html( array( 'p' => array() ), 'post' );
				}
				return $preserve;
			}
		);

		try {
			$markdown->get_parser();
		} finally {
			$parser->setValue( null, $original );
		}

		$this->assertSame( array( 'p' => array() ), $nested );
		$tags = $markdown->wp_kses_allowed_html( array( 'p' => array() ), 'post' );
		$this->assertTrue( $tags['p']['markdown'] );
	}
}
