<?php
/**
 * Wpcomsh HTML Linkifier.
 *
 * @package wpcomsh
 */

/**
 * Walks an HTML document and applies a caller-provided transformation to each
 * unprotected text node, returning the document with those updates applied.
 *
 * Subclassing WP_HTML_Tag_Processor gives access to the protected `bookmarks`
 * and `lexical_updates` properties, which lets text offsets be read and
 * replacements queued as byte-precise edits instead of copying the entire
 * document through PHP strings as it's walked.
 *
 * SCRIPT, STYLE, and TEXTAREA are raw text elements that the tokenizer bundles
 * as single `#tag` tokens — their contents never surface as `#text` nodes, so
 * nothing here needs to track them. For A, PRE, CODE, and
 * DIV.skip-make-clickable, the scanner advances past the whole element in one
 * inner loop, so everything that reaches the `#text` branch is guaranteed to
 * be linkifiable content.
 */
class Wpcomsh_HTML_Linkifier extends WP_HTML_Tag_Processor {

	/**
	 * Applies $updater to every unprotected `#text` node in $html.
	 *
	 * @param string   $html    HTML document to walk.
	 * @param callable $updater Receives the raw text of an unprotected text
	 *                          node and returns its replacement.
	 * @return string Updated HTML.
	 */
	public static function modify_raw_text_nodes( string $html, callable $updater ): string {
		$scanner      = new self( $html );
		$replacements = array();

		while ( $scanner->next_token() ) {
			$token_name = $scanner->get_token_name();

			$is_protected_opener = ! $scanner->is_tag_closer() && (
				'A' === $token_name
				|| 'CODE' === $token_name
				|| 'PRE' === $token_name
				|| ( 'DIV' === $token_name && $scanner->has_class( 'skip-make-clickable' ) )
			);

			if ( $is_protected_opener ) {
				// Assumes well-formed HTML; e.g. will not track missing closing tags or
				// implicitly-closed elements. To improve reliability use the HTML Processor.
				$depth = 1;
				while ( $depth > 0 && $scanner->next_token() ) {
					if ( $token_name === $scanner->get_token_name() ) {
						$depth += $scanner->is_tag_closer() ? -1 : 1;
					}
				}
				continue;
			}

			if ( '#text' !== $token_name ) {
				continue;
			}

			// A #text token always has a span, so the bookmark lookup below is safe.
			$scanner->set_bookmark( 'here' );
			$here        = $scanner->bookmarks['here'];
			$raw_text    = substr( $html, $here->start, $here->length );
			$transformed = $updater( $raw_text );

			if ( $transformed !== $raw_text ) {
				$replacements[] = new WP_HTML_Text_Replacement( $here->start, $here->length, $transformed );
			}
		}

		if ( empty( $replacements ) ) {
			return $html;
		}

		$applier                  = new self( $html );
		$applier->lexical_updates = $replacements;
		return $applier->get_updated_html();
	}
}
