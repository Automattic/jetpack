<?php
/**
 * Class GFM_Markdown_Test for unit testing special classic editor markdown features.
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Include the module to ensure we're loading everything even though we're only testing the Markdown parser itself.
 */
require_once JETPACK__PLUGIN_DIR . 'modules/markdown/easy-markdown.php';

/**
 * @group markdown
 * @covers WPCom_GHF_Markdown_Parser
 */
#[Group( 'markdown' )]
#[CoversClass( WPCom_GHF_Markdown_Parser::class )]
class GFM_Markdown_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test verifying that ~~strikethrough~~ works.
	 *
	 * @dataProvider data_strikethrough
	 *
	 * @param string $markdown Markdown to test.
	 * @param string $expected Expected HTML.
	 */
	#[DataProvider( 'data_strikethrough' )]
	public function test_strikethrough( $markdown, $expected ) {
		$this->assertEquals( $expected, trim( ( new WPCom_GHF_Markdown_Parser() )->transform( $markdown ) ) );
	}

	/**
	 * Data provider for test_strikethrough.
	 *
	 * @return array
	 */
	public static function data_strikethrough() {
		return array(
			'double strikethrough'           => array(
				'~~strikethrough~~',
				'<del>strikethrough</del>',
			),
			'single strikethrough'           => array(
				'~strikethrough~',
				'~strikethrough~',
			),
			'strikethrough within backticks' => array(
				'`~~strikethrough~~`',
				'<code>~~strikethrough~~</code>',
			),
			'non closing strikthrough'       => array(
				'~~strikethrough',
				'~~strikethrough',
			),
			'strikethrough multiple words'   => array(
				'~~strike through~~',
				'<del>strike through</del>',
			),
			'strikthrough on multiple lines' => array(
				"~~strike\nthrough~~",
				"<del>strike\nthrough</del>",
			),
		);
	}
}
