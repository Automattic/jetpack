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
	 * @param string      $html The HTML string containing the code block.
	 * @param array       $tokenized_code_data The tokenized code data.
	 * @param string|null $language_name The language name, if any.
	 * @return null|array{0: string, 1: string} Null on failure, or array with original code string
	 *                                          and the tokenized HTML markup.
	 */
	public static function get_updated_html_with_replaced_content( string $html, array $tokenized_code_data, ?string $language_name ): ?array {
		$processor = self::create_fragment( $html );

		// Skip leading whitespace
		while (
			$processor->next_token()
			&& $processor->get_token_type() === '#text'
			&& $processor->text_node_classification === self::TEXT_IS_WHITESPACE
		) {
			continue;
		}

		// The serialized PRE tag has block wrapper attributes.
		// Remove them, they'll be applied in a wrapper.
		if ( $processor->get_tag() !== 'PRE' ) {
			return null;
		} else {
			$processor->set_bookmark( 'pre_open' );
		}

		// The next token should be the CODE tag opener.
		if ( ! $processor->next_token() || $processor->get_tag() !== 'CODE' ) {
			return null;
		}

		if ( $language_name ) {
			$processor->add_class(
				'language-' .
				\strtr(
					\strtolower( $language_name ),
					array(
						' '  => '_',
						"\t" => '_',
						"\n" => '_',
						"\r" => '_',
						"\f" => '_',
					)
				)
			);
			$processor->get_updated_html();
		}
		$processor->set_bookmark( 'code_content_start' );

		/*
		 * The code should be 1 HTML CODE element containing the text.
		 * <code>### text ###</code>.
		 * OR it can be an empty CODE element:
		 * <code></code>
		 */
		if ( ! $processor->next_token() ) {
			return null;
		}
		if ( $processor->get_token_type() === '#text' ) {
			$code_string = $processor->get_modifiable_text();
			if ( ! $processor->next_token() ) {
				return null;
			}
		} else {
			$code_string = '';
		}

		// This must be the closing CODE tag of <code>…text…</code> or empty <code></code>.
		if ( $processor->get_tag() !== 'CODE' || ! $processor->is_tag_closer() ) {
			return null;
		}
		$processor->set_bookmark( 'code_content_end' );

		if (
			! isset( $processor->bookmarks['_pre_open'] ) ||
			! isset( $processor->bookmarks['_code_content_start'] ) ||
			! isset( $processor->bookmarks['_code_content_end'] )
		) {
			return null;
		}

		$replacement_code_html = array();
		foreach ( $tokenized_code_data as $line ) {
			$replacement_code_html[] = '<div class="cm-line">';
			foreach ( $line as $chunk ) {
				if (
					! \is_array( $chunk ) ||
					! isset( $chunk[0] ) ||
					! \is_string( $chunk[0] ) ||
					( isset( $chunk[1] ) && ! \is_string( $chunk[1] ) )
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
					$replacement_code_html[] = \sprintf(
						'<span class="%s">%s</span>',
						esc_attr( $class_name ),
						$html_encoded_code
					);
				}
			}
			$replacement_code_html[] = '</div>';
		}

		// Clear attributes from the PRE tag, replace everything inside the CODE block, trim the end.
		$bm_pre_open = $processor->bookmarks['_pre_open'];
		$bm_start    = $processor->bookmarks['_code_content_start'];
		$bm_end      = $processor->bookmarks['_code_content_end'];
		$start       = $bm_start->start + $bm_start->length;
		$length      = $bm_end->start - $start;

		// Remove all attributes from the PRE tag, rewrite it as a plain <pre>.
		$processor->lexical_updates[] = new WP_HTML_Text_Replacement(
			$bm_pre_open->start,
			$bm_pre_open->length,
			'<pre>'
		);
		$processor->lexical_updates[] = new WP_HTML_Text_Replacement(
			$start,
			$length,
			implode( '', $replacement_code_html )
		);
		$processor->lexical_updates[] = new WP_HTML_Text_Replacement(
			$bm_end->start + $bm_end->length,
			// No need to calculate this precisely, just trim everything after this point.
			\strlen( $processor->html ),
			''
		);

		// Normalize to ensure HTML that is safer to embed with other HTML.
		// This ensures tags are correctly closed and extraneous close tags are not present.
		$html = self::normalize( $processor->get_updated_html() );
		if ( null === $html ) {
			return null;
		}

		return array( $code_string, $html );
	}
}
