<?php
/**
 * Tests for the Write editor's blogging-prompt seed helper.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php';

/**
 * Class Write_Prompt_Seed_Test
 */
class Write_Prompt_Seed_Test extends \WorDBless\BaseTestCase {

	/**
	 * A plain prompt is wrapped in a quote block.
	 */
	public function test_prompt_quote_markup_wraps_text_in_a_quote_block() {
		$this->assertSame(
			'<blockquote class="wp-block-quote"><p>What made you smile today?</p></blockquote>',
			wpcom_write_prompt_quote_markup( 'What made you smile today?' )
		);
	}

	/**
	 * Blank/whitespace-only text produces no markup.
	 */
	public function test_prompt_quote_markup_is_empty_for_blank_text() {
		$this->assertSame( '', wpcom_write_prompt_quote_markup( '   ' ) );
	}

	/**
	 * Entity-encoded, tag-carrying text is decoded, stripped, and escaped once —
	 * so a prompt id is never a vector for markup and entities aren't
	 * double-encoded.
	 */
	public function test_prompt_quote_markup_decodes_entities_and_strips_tags() {
		$this->assertSame(
			'<blockquote class="wp-block-quote"><p>Isn&#039;t it great? Yes</p></blockquote>',
			wpcom_write_prompt_quote_markup( 'Isn&#39;t it great? <b>Yes</b>' )
		);
	}

	/**
	 * Citation text with no URL is added as a plain <cite>.
	 */
	public function test_prompt_quote_markup_adds_plain_citation() {
		$this->assertSame(
			'<blockquote class="wp-block-quote"><p>What made you smile today?</p><cite>View all responses</cite></blockquote>',
			wpcom_write_prompt_quote_markup( 'What made you smile today?', 'View all responses' )
		);
	}

	/**
	 * When a URL is given, the citation links to the responses page.
	 */
	public function test_prompt_quote_markup_links_citation_when_url_given() {
		$this->assertSame(
			'<blockquote class="wp-block-quote"><p>What made you smile today?</p>'
				. '<cite><a href="https://wordpress.com/tag/dailyprompt-1" target="_blank" rel="noreferrer noopener">View all responses</a></cite></blockquote>',
			wpcom_write_prompt_quote_markup(
				'What made you smile today?',
				'View all responses',
				'https://wordpress.com/tag/dailyprompt-1'
			)
		);
	}
}
