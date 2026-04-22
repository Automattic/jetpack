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
 * and `lexical_updates` properties, which lets the HTML-crawling logic live in
 * one place and lets replacements be enqueued as byte-precise edits instead of
 * copying the entire document into PHP strings as it's walked.
 *
 * SCRIPT, STYLE, and TEXTAREA are raw text elements that the tokenizer bundles
 * as single `#tag` tokens, so their contents never surface as `#text` nodes and
 * don't need depth tracking here. A, PRE, and CODE are tracked explicitly, and
 * DIV.skip-make-clickable subtrees are skipped by depth.
 */
class Wpcomsh_HTML_Linkifier extends WP_HTML_Tag_Processor {

	private const PROTECTED_TAGS = array( 'A', 'PRE', 'CODE' );

	/**
	 * Applies $updater to every unprotected `#text` node in $html.
	 *
	 * @param string   $html    HTML document to walk.
	 * @param callable $updater Receives the raw text of an unprotected text
	 *                          node and returns its replacement.
	 * @return string Updated HTML.
	 */
	public static function modify_raw_text_nodes( string $html, callable $updater ): string {
		$scanner         = new self( $html );
		$replacements    = array();
		$protected_depth = 0;
		$skip_div_depth  = 0;

		while ( $scanner->next_token() ) {
			$token_type = $scanner->get_token_type();

			if ( '#tag' === $token_type ) {
				$tag_name = $scanner->get_tag();
				if ( $scanner->is_tag_closer() ) {
					if ( $protected_depth > 0 && in_array( $tag_name, self::PROTECTED_TAGS, true ) ) {
						--$protected_depth;
					} elseif ( $skip_div_depth > 0 && 'DIV' === $tag_name ) {
						--$skip_div_depth;
					}
				} elseif ( in_array( $tag_name, self::PROTECTED_TAGS, true ) ) {
					++$protected_depth;
				} elseif ( 'DIV' === $tag_name && ( $skip_div_depth > 0 || $scanner->has_class( 'skip-make-clickable' ) ) ) {
					++$skip_div_depth;
				}
				continue;
			}

			if ( '#text' !== $token_type || $protected_depth > 0 || $skip_div_depth > 0 ) {
				continue;
			}

			$here = $scanner->current_token_span();
			if ( null === $here ) {
				continue;
			}

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

	/**
	 * Byte span of the current token, or null if a bookmark cannot be set.
	 *
	 * The underlying token offsets (`token_starts_at`, `token_length`) are
	 * private in WP_HTML_Tag_Processor; the bookmark API is the documented
	 * way to read them from a subclass.
	 *
	 * @return WP_HTML_Span|null
	 */
	private function current_token_span(): ?WP_HTML_Span {
		if ( ! $this->set_bookmark( 'here' ) ) {
			return null;
		}
		$span = $this->bookmarks['here'];
		$this->release_bookmark( 'here' );
		return $span;
	}
}
