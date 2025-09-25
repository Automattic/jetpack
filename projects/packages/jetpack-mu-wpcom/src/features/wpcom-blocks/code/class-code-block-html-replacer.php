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
	 * Replace the code placeholder.
	 *
	 * @param array $tokenized_code_data The tokenized code data.
	 * @return null|array{0: string, 1: string} Null on failure, or array with original code string
	 *                                          and the tokenized HTML markup.
	 */
	public function get_updated_html_with_replaced_content( array $tokenized_code_data ): ?array {
		// Find the location for insertion.
		if ( ! $this->next_tag( 'CODE' ) ) {
			return null;
		}
		$this->set_bookmark( 'code_block_html_replace_start' );

		// The code should be 1 HTML CODE element containing the text.
		// <code>### text ###</code>.
		if (
			! $this->next_token() ||
			$this->get_token_type() !== '#text'
		) {
			return null;
		}
		$code_string = $this->get_modifiable_text();
		if (
			! $this->next_token() ||
			$this->get_tag() !== 'CODE' ||
			! $this->is_tag_closer()
		) {
			return null;
		}
		$this->set_bookmark( 'code_block_html_replace_end' );

		// phpcs:ignore MediaWiki.Usage.ForbiddenFunctions.isset
		if ( ! isset(
			$this->bookmarks['_code_block_html_replace_start'],
			$this->bookmarks['_code_block_html_replace_end']
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
				 * Do not rely on `esc_html`, it would mishandle character references
				 * that appear to be encoded already. HTML like `&amp;` would be
				 * ignored, resulting in `&` rendering in the browser instead of the
				 * desired HTML `&amp;` which must be encoded as `&amp;amp;`.
				 *
				 * Below, the `double_encode` argument is set to `true` to ensure
				 * prevent this issue and ensure correct encoding.
				 */
				$html_encoded_code = _wp_specialchars(
					wp_check_invalid_utf8( $code ),
					ENT_NOQUOTES,
					false,
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
		$bm_start = $this->bookmarks['_code_block_html_replace_start'];
		$bm_end   = $this->bookmarks['_code_block_html_replace_end'];
		$start    = $bm_start->start + $bm_start->length;
		$length   = $bm_end->start - $start;

		$this->lexical_updates[] = new WP_HTML_Text_Replacement(
			$start,
			$length,
			implode( '', $replacement_code_html )
		);

		return array( $code_string, $this->get_updated_html() );
	}
}
