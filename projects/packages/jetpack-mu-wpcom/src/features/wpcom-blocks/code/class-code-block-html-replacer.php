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
	 * This method does not perform any safety checking on the provided HTML.
	 *
	 * @param array $tokenized_code_data The tokenized code data.
	 * @return null|array{0: string, 1: string}
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

		if ( ! isset(
			$this->bookmarks['_code_block_html_replace_start'],
			$this->bookmarks['_code_block_html_replace_end']
		) ) {
			return null;
		}

		/** @todo make this an array */
		$replacement_code_html = '';
		foreach ( $tokenized_code_data as $line ) {
			$replacement_code_html .= '<div class="cm-line">';
			foreach ( $line as $chunk ) {
				$code = base64_decode( $chunk[0], true );
				if ( false === $code ) {
					continue;
				}
				$class = $chunk[1] ?? null;

				if ( ! $class ) {
					$replacement_code_html .= esc_html( $code );
				} else {
					$replacement_code_html .= sprintf(
						'<span class="%s">%s</span>',
						esc_attr( $class ),
						_wp_specialchars(
							$code,
							ENT_NOQUOTES,
							false,
							true // Double-encode, yes. Do not attempt to normalize this text.
						)
					);
				}
			}
			$replacement_code_html .= '</div>';
		}

		// We'll start at the end of the CODE opener.
		$bm_start = $this->bookmarks['_code_block_html_replace_start'];
		$bm_end   = $this->bookmarks['_code_block_html_replace_end'];
		$start    = $bm_start->start + $bm_start->length;
		$length   = $bm_end->start - $start;

		$this->lexical_updates[] = new WP_HTML_Text_Replacement(
			$start,
			$length,
			$replacement_code_html
		);

		return array( $code_string, $this->get_updated_html() );
	}
}
