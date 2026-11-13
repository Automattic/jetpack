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
	 * The kses filter must not load the parser: loading it runs translation filters, which can run kses again mid-load.
	 */
	public function test_wp_kses_allowed_html_does_not_load_parser() {
		$parser = new ReflectionProperty( WPCom_Markdown::class, 'parser' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$parser->setAccessible( true );
		}
		$original = $parser->getValue();
		$parser->setValue( null, null );

		try {
			$tags = WPCom_Markdown::get_instance()->wp_kses_allowed_html(
				array(
					'p'   => array( 'class' => true ),
					'div' => array( 'class' => true ),
				),
				'post'
			);
			$this->assertNull( $parser->getValue() );
		} finally {
			$parser->setValue( null, $original );
		}

		$this->assertTrue( $tags['p']['markdown'] );
		$this->assertArrayNotHasKey( 'markdown', $tags['div'] );
	}
}
