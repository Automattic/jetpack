<?php
/**
 * HTML Replacer class for the Code Block.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

use WP_HTML_Processor;
use WP_HTML_Text_Replacement;

/**
 * Safely replace block HTML content with tokenized HTML.
 */
class Code_Block_HTML_Replacer extends WP_HTML_Processor {
	/**
	 * Replace the code block content with the tokenize HTML.
	 *
	 * This extracts the original code text and provides the updated HTML string
	 * with the tokenized HTML inserted. The HTML structure and replacement
	 * contents are checked to ensure safety.
	 *
	 * @param string $html The tokenized code data.
	 * @param array  $tokenized_code_data The tokenized code data.
	 * @return null|array{0: string, 1: string} Null on failure, or array with original code string
	 *                                          and the tokenized HTML markup.
	 */
	public static function get_updated_html_with_replaced_content( string $html, array $tokenized_code_data ): ?array {
		$processor = self::create_fragment( $html );

		// Find the location for insertion.
		if ( ! $processor->next_tag( 'CODE' ) ) {
			return null;
		}
		$processor->set_bookmark( 'code_block_html_replace_start' );

		// The code should be 1 HTML CODE element containing the text.
		// <code>### text ###</code>.
		if (
			! $processor->next_token() ||
			$processor->get_token_type() !== '#text'
		) {
			return null;
		}
		$code_string = $processor->get_modifiable_text();
		if (
			! $processor->next_token() ||
			$processor->get_tag() !== 'CODE' ||
			! $processor->is_tag_closer()
		) {
			return null;
		}
		$processor->set_bookmark( 'code_block_html_replace_end' );

		// phpcs:ignore MediaWiki.Usage.ForbiddenFunctions.isset
		if ( ! isset(
			$processor->bookmarks['_code_block_html_replace_start'],
			$processor->bookmarks['_code_block_html_replace_end']
		) ) {
			return null;
		}

		$replacement_code_html = array();
		foreach ( $tokenized_code_data as $line ) {
			$replacement_code_html[] = '<div class="cm-line">';
			foreach ( $line as $chunk ) {
				if (
					! is_array( $chunk ) ||
					! isset( $chunk[0] ) ||
					! is_string( $chunk[0] ) ||
					( isset( $chunk[1] ) && ! is_string( $chunk[1] ) )
				) {
					return null;
				}

				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
				$code = base64_decode( $chunk[0], true );
				if ( false === $code ) {
					return null;
				}

				$class_name = $chunk[1] ?? null;

				/*
				 * Do not rely on `esc_html`. It would mishandle character references
				 * that appear to be encoded already. HTML like `&amp;` would be
				 * ignored, resulting in `&` rendering in the browser instead of the
				 * desired `&amp;` which must be HTML encoded as `&amp;amp;`.
				 *
				 * - ENT_NOQUOTES: Quote characters do not require encoding in HTML text nodes.
				 * - ENT_SUBSTITUTE: Replace invalid code unit sequences with a Unicode
				 *                   substitution character. This is unexpected, but safe.
				 * - 'UTF-8' The base64 encoding from JavaScript is UTF-8.
				 * - true: Force HTML character references to be used for `&`, `<`, `>`
				 *         in the input string.
				 */
				$html_encoded_code = htmlspecialchars(
					$code,
					ENT_NOQUOTES | ENT_SUBSTITUTE,
					'UTF-8',
					true
				);

				if ( ! $class_name ) {
					$replacement_code_html[] = $html_encoded_code;
				} else {
					$replacement_code_html[] = sprintf(
						'<span class="%s">%s</span>',
						esc_attr( $class_name ),
						$html_encoded_code
					);
				}
			}
			$replacement_code_html[] = '</div>';
		}

		// We'll start at the end of the CODE opener.
		$bm_start = $processor->bookmarks['_code_block_html_replace_start'];
		$bm_end   = $processor->bookmarks['_code_block_html_replace_end'];
		$start    = $bm_start->start + $bm_start->length;
		$length   = $bm_end->start - $start;

		$processor->lexical_updates[] = new WP_HTML_Text_Replacement(
			$start,
			$length,
			implode( '', $replacement_code_html )
		);

		return array( $code_string, $processor->get_updated_html() );
	}
}
