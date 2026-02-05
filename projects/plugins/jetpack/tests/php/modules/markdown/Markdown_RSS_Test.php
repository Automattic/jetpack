<?php
/**
 * Tests for the Markdown RSS source:markdown element output.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/markdown/easy-markdown.php';
require_once JETPACK__PLUGIN_DIR . '_inc/lib/markdown/rss.php';

/**
 * Class Markdown_RSS_Test
 *
 * @group markdown
 * @covers ::jetpack_markdown_rss_output_source_markdown
 * @covers ::jetpack_markdown_rss_namespace
 */
#[Group( 'markdown' )]
#[CoversFunction( 'jetpack_markdown_rss_output_source_markdown' )]
#[CoversFunction( 'jetpack_markdown_rss_namespace' )]
class Markdown_RSS_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that a post with Markdown content outputs the source:markdown element.
	 */
	public function test_outputs_source_markdown_for_markdown_post() {
		$markdown = "# Hello World\n\nThis is **bold** text.";
		$post_id  = self::factory()->post->create(
			array(
				'post_content'          => '<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>',
				'post_content_filtered' => $markdown,
			)
		);
		update_post_meta( $post_id, WPCom_Markdown::IS_MD_META, true );

		$this->go_to( '/?p=' . $post_id );
		setup_postdata( get_post( $post_id ) );

		ob_start();
		jetpack_markdown_rss_output_source_markdown();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<source:markdown><![CDATA[', $output );
		$this->assertStringContainsString( $markdown, $output );
		$this->assertStringContainsString( ']]></source:markdown>', $output );

		wp_reset_postdata();
	}

	/**
	 * Test that a post without Markdown meta produces no output.
	 */
	public function test_no_output_without_markdown_meta() {
		$post_id = self::factory()->post->create(
			array(
				'post_content'          => '<p>Regular post.</p>',
				'post_content_filtered' => '# Some markdown content',
			)
		);

		$this->go_to( '/?p=' . $post_id );
		setup_postdata( get_post( $post_id ) );

		ob_start();
		jetpack_markdown_rss_output_source_markdown();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		wp_reset_postdata();
	}

	/**
	 * Test that a Markdown post with empty post_content_filtered produces no output.
	 */
	public function test_no_output_with_empty_content_filtered() {
		$post_id = self::factory()->post->create(
			array(
				'post_content'          => '<p>Some HTML.</p>',
				'post_content_filtered' => '',
			)
		);
		update_post_meta( $post_id, WPCom_Markdown::IS_MD_META, true );

		$this->go_to( '/?p=' . $post_id );
		setup_postdata( get_post( $post_id ) );

		ob_start();
		jetpack_markdown_rss_output_source_markdown();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		wp_reset_postdata();
	}

	/**
	 * Test that CDATA closing sequence in Markdown content is escaped.
	 */
	public function test_cdata_closing_sequence_is_escaped() {
		$markdown = 'Code example: ]]> should be escaped';
		$post_id  = self::factory()->post->create(
			array(
				'post_content'          => '<p>Code example: ]]&gt; should be escaped</p>',
				'post_content_filtered' => $markdown,
			)
		);
		update_post_meta( $post_id, WPCom_Markdown::IS_MD_META, true );

		$this->go_to( '/?p=' . $post_id );
		setup_postdata( get_post( $post_id ) );

		ob_start();
		jetpack_markdown_rss_output_source_markdown();
		$output = ob_get_clean();

		$this->assertStringContainsString( ']]&gt;', $output );
		// Ensure the raw ]]> does not appear between CDATA markers.
		$cdata_content = $this->get_cdata_content( $output );
		$this->assertNotEmpty( $cdata_content, 'CDATA content should have been extracted from the output.' );
		$this->assertStringNotContainsString( ']]>', $cdata_content );

		wp_reset_postdata();
	}

	/**
	 * Test that Markdown content containing printf format specifiers is output correctly.
	 */
	public function test_printf_format_specifiers_preserved() {
		$markdown = 'Use `sprintf( "%s is %d", $name, $age )` for formatting.';
		$post_id  = self::factory()->post->create(
			array(
				'post_content'          => '<p>Use <code>sprintf( "%s is %d", $name, $age )</code> for formatting.</p>',
				'post_content_filtered' => $markdown,
			)
		);
		update_post_meta( $post_id, WPCom_Markdown::IS_MD_META, true );

		$this->go_to( '/?p=' . $post_id );
		setup_postdata( get_post( $post_id ) );

		ob_start();
		jetpack_markdown_rss_output_source_markdown();
		$output = ob_get_clean();

		$this->assertStringContainsString( $markdown, $output );

		wp_reset_postdata();
	}

	/**
	 * Test that the RSS2 namespace declaration is output.
	 */
	public function test_rss_namespace_outputs_source_xmlns() {
		ob_start();
		jetpack_markdown_rss_namespace();
		$output = ob_get_clean();

		$this->assertSame( 'xmlns:source="https://source.scripting.com/"', $output );
	}

	/**
	 * Extract the content between CDATA markers.
	 *
	 * @param string $output The full XML output.
	 * @return string The content inside CDATA, or empty string if not found.
	 */
	private function get_cdata_content( $output ) {
		if ( preg_match( '/<!\[CDATA\[(.*?)\]\]>/s', $output, $matches ) ) {
			return $matches[1];
		}
		return '';
	}
}
