<?php
/**
 * Class GFM_Markdown_Test for unit testing special classic editor markdown features.
 */

/**
 * Include the module to ensure we're loading everything even though we're only testing the Markdown parser itself.
 */
require_once JETPACK__PLUGIN_DIR . 'modules/markdown/easy-markdown.php';

/**
 * @group markdown
 * @covers WPCom_GHF_Markdown_Parser
 */
class GFM_Markdown_Test extends WP_UnitTestCase {
	/**
	 * Test verifying that ~~strikethrough~~ works.
	 *
	 * @dataProvider data_strikethrough
	 *
	 * @param string $markdown Markdown to test.
	 * @param string $expected Expected HTML.
	 */
	public function test_strikethrough( $markdown, $expected ) {
		$this->assertEquals( $expected, trim( ( new WPCom_GHF_Markdown_Parser() )->transform( $markdown ) ) );
	}

	/**
	 * Data provider for test_strikethrough.
	 *
	 * @return array
	 */
	public function data_strikethrough() {
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
