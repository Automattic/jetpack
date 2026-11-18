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
	 * Keep the blocks whose names start with p2/, as a host would.
	 */
	private function keep_p2_blocks() {
		add_filter(
			'jetpack_comments_keep_block',
			static function ( $keep, $block ) {
				return $keep || 0 === strpos( $block['blockName'] ?? '', 'p2/' );
			},
			10,
			2
		);
	}

	public function tear_down() {
		remove_all_filters( 'jetpack_comments_keep_block' );
		remove_all_filters( 'render_block' );

		parent::tear_down();
	}

	public function test_render_outputs_a_kept_block_as_html() {
		$this->keep_p2_blocks();
		add_filter(
			'render_block',
			static function ( $content ) {
				return $content . '<!-- rendered -->';
			}
		);

		$output = Block_Editor::render( "<!-- wp:p2/embed-github -->\n<div>GH</div>\n<!-- /wp:p2/embed-github -->" );

		$this->assertStringContainsString( '<div>GH</div>', $output );
		$this->assertStringContainsString( '<!-- rendered -->', $output );
		$this->assertStringNotContainsString( '<!-- wp:', $output );
	}

	public function test_keep_allowed_blocks_saves_a_kept_block_with_its_delimiters() {
		$this->keep_p2_blocks();
		$content = "<!-- wp:p2/embed-github -->\n<div>GH</div>\n<!-- /wp:p2/embed-github -->";

		$this->assertSame( $content, wp_unslash( Block_Editor::init()->keep_allowed_blocks( wp_slash( $content ) ) ) );
	}

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
