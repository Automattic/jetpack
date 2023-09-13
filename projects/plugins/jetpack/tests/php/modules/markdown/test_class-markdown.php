<?php
/**
 * Class WP_Test_GFM_Markdown for unit testing special classic editor markdown features.
 */

/**
 * Include the module to ensure we're loading everything even though we're only testing the Markdown parser itself.
 */
require_once JETPACK__PLUGIN_DIR . 'modules/markdown/easy-markdown.php';

/**
 * @group markdown
 * @covers WPCom_GHF_Markdown_Parser
 */
class WP_Test_GFM_Markdown extends WP_UnitTestCase {

	/**
	 * Test verifying that ~~strikethrough~~ works.
	 */
	public function test_strikethrough() {
		$markdown = '~~strikethrough~~';
		$expected = '<del>strikethrough</del>';
		$this->assertEquals( $expected, trim( ( new WPCom_GHF_Markdown_Parser() )->transform( $markdown ) ) );
	}

	/**
	 * Test verifying that ~strikethrough~ does not convert.
	 */
	public function test_strikethrough_single() {
		$markdown = '~strikethrough~';
		$expected = '~strikethrough~';
		$this->assertEquals( $expected, trim( ( new WPCom_GHF_Markdown_Parser() )->transform( $markdown ) ) );
	}

	/**
	 * Test verifying that ~~strikethrough~~ does not convert within backticks.
	 */
	public function test_strikethrough_in_backticks() {
		$markdown = '`~~strikethrough~~`';
		$expected = '<code>~~strikethrough~~</code>';
		$this->assertEquals( $expected, trim( ( new WPCom_GHF_Markdown_Parser() )->transform( $markdown ) ) );
	}

}
