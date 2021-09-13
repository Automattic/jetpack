<?php
/**
 * GitHub-Flavoured Markdown unit tests.
 *
 * @package Jetpack
 */

// Require the whole lib to process text.
require_once JETPACK__PLUGIN_DIR . '_inc/lib/markdown.php';

/**
 * Class for testing the WPCom_GHF_Markdown_Parser class.
 *
 * @covers WPCom_GHF_Markdown_Parser
 */
class WP_Test_WPCom_GHF_Markdown_Parser extends WP_UnitTestCase {
	/**
	 * Test that links are preserved when going through the Markdown parser.
	 *
	 * @covers WPCom_GHF_Markdown_Parser
	 * @dataProvider get_text_urls
	 *
	 * @since 9.2.0
	 *
	 * @param string $text     The Markdown text we want to transform.
	 * @param string $expected Expected HTML content.
	 */
	public function test_urls_preserve( $text, $expected ) {
		/*
		 * Text always ends with a newline.
		 * Let's add it here (and not in the data provider)
		 * to make things clearer there.
		 */
		$expected .= "\n";

		$transformed_text = ( new WPCom_GHF_Markdown_Parser() )->transform( $text );
		$this->assertEquals( $expected, $transformed_text );
	}

	/**
	 * Get link examples to test how Markdown avoids transforming elements in links.
	 *
	 * @return array The test data.
	 */
	public function get_text_urls() {
		return array(
			'no_link_bold'                      => array(
				'Some **bold** text',
				'Some <strong>bold</strong> text',
			),
			'link_bold'                         => array(
				'**[A bold link](https://jetpack.com/)**',
				'<strong><a href="https://jetpack.com/">A bold link</a></strong>',
			),
			'link_undercore'                    => array(
				'[A link with underscore in URL](https://jetpack.com/_features_/)',
				'<a href="https://jetpack.com/_features_/">A link with underscore in URL</a>',
			),
			'link_alone'                        => array(
				'https://jetpack.com/',
				'https://jetpack.com/',
			),
			'link_underscore_alone'             => array(
				'https://jetpack.com/_features_/',
				'https://jetpack.com/_features_/',
			),
			'ftp_link_underscore'               => array(
				'ftp://_best_pack@jetpack.com:123',
				'ftp://_best_pack@jetpack.com:123',
			),
			// This is current behavior before this patch.
			'explicit URL'                      => array(
				'url: <https://jetpack.com/_features_/>',
				'url: <a href="https://jetpack.com/_features_/">https://jetpack.com/_features_/</a>',
			),
			// This too.
			'URL in link text'                  => array(
				'url: [https://jetpack.com/](https://jetpack.com/#xyz)',
				'url: <a href="https://jetpack.com/#xyz">https://jetpack.com/</a>',
			),

			'bolded URL'                        => array(
				'**https://jetpack.com/_features_/**',
				'<strong>https://jetpack.com/_features_/</strong>',
			),
			'emphasized URL'                    => array(
				'_https://jetpack.com/_features_/_',
				'<em>https://jetpack.com/_features_/</em>',
			),
			'URL with odd but legal characters' => array(
				'https://example.com/_form?type=*&q=a+(b+or+c)&arr[]=1&arr[]=2&value=_foo_bar',
				'https://example.com/_form?type=*&q=a+(b+or+c)&arr[]=1&arr[]=2&value=_foo_bar',
			),
			// Let's ensure we are not breaking regular HTML. These should not change.
			'href attribute with single quotes' => array(
				"<a href='https://example.com'>example</a>",
				"<a href='https://example.com'>example</a>",
			),
			'image tag'                         => array(
				'<img src="whatever.png" alt="Text" width="1024" height="470" class="alignleft size-full wp-image-37190" />',
				'<img src="whatever.png" alt="Text" width="1024" height="470" class="alignleft size-full wp-image-37190" />',
			),
		);
	}
}
