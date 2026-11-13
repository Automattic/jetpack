<?php
/**
 * Tests for Block_Editor.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Block_Editor
 */
#[CoversClass( Block_Editor::class )]
class Block_Editor_Test extends BaseTestCase {

	/**
	 * @dataProvider provide_keep_allowed_blocks
	 */
	#[DataProvider( 'provide_keep_allowed_blocks' )]
	public function test_keep_allowed_blocks( $content, $expected ) {
		$this->assertSame( $expected, wp_unslash( Block_Editor::init()->keep_allowed_blocks( wp_slash( $content ) ) ) );
	}

	public static function provide_keep_allowed_blocks() {
		$paragraph = "<!-- wp:paragraph -->\n<p>Hi</p>\n<!-- /wp:paragraph -->";

		return array(
			'plain text is untouched'    => array( 'Hi <b>there</b>', 'Hi <b>there</b>' ),
			'paragraph is kept'          => array( $paragraph, $paragraph ),
			'html block is dropped'      => array( "<!-- wp:html --><script>x()</script><!-- /wp:html -->\n\n$paragraph", "\n\n$paragraph" ),
			'empty paragraph is dropped' => array( "$paragraph\n\n<!-- wp:paragraph -->\n<p><br></p>\n<!-- /wp:paragraph -->\n\n$paragraph", "$paragraph\n\n\n\n$paragraph" ),
			'heading becomes bold'       => array( '<!-- wp:heading --><h2>Hi</h2><!-- /wp:heading -->', "<!-- wp:paragraph -->\n<p><strong>Hi</strong></p>\n<!-- /wp:paragraph -->" ),
		);
	}
}
