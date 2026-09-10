<?php
/**
 * Locates the document's real closing body tag in an HTML buffer.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Finds the byte offset of a document's real closing body tag.
 *
 * A literal '</body>' can appear in places that are not markup: inside a
 * script's source (an HTML string a document.write() call later emits),
 * inside a <textarea>, <title> or <style>, inside an HTML comment, or inside
 * a quoted attribute value. Inserting markup at such an occurrence corrupts
 * the page — the injected '</script>' closes the surrounding script early and
 * the remaining JavaScript renders as visible text (BOOST-585).
 *
 * Rather than model those contexts by hand, this walks the buffer with core's
 * spec-compliant HTML tokenizer, which only reports a BODY closer when the
 * byte really is one.
 *
 * Best effort by design: the buffer is an output-buffer window, and a window
 * that begins inside a script or comment region whose opening tag was flushed
 * in an earlier chunk cannot be tokenized correctly by any scan of the window
 * alone. Whenever no trustworthy closing tag is found the locator returns
 * null and the caller appends at the end of the buffer instead of rewriting
 * existing markup.
 *
 * @since 4.7.0
 */
class Body_Close_Locator {

	/**
	 * Containers whose content the tokenizer reports as ordinary tokens even
	 * though a BODY closer inside them is never the document's closing tag:
	 * template content is inert DOM, noscript content is text when scripting
	 * is enabled, and SVG/MathML are foreign content. Closers seen inside any
	 * of these are skipped. (Raw-text containers — script, style, textarea,
	 * title, iframe, xmp, noembed, noframes — need no entry here: the
	 * tokenizer already withholds their contents.)
	 *
	 * @var string[]
	 */
	const SKIPPED_CONTAINERS = array( 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH' );

	/**
	 * Buffers above this size are not scanned at all. Bounds the walk's CPU
	 * cost, which is roughly linear in token count. The buffer this locator
	 * sees is normally a few hundred bytes to a few tens of kilobytes; it can
	 * grow when script retention holds earlier chunks back.
	 *
	 * @var int
	 */
	const MAX_SCAN_BYTES = 1000000;

	/**
	 * Buffers whose widest apparent tag exceeds this are not scanned. The
	 * tokenizer allocates one attribute token per attribute on the tag it is
	 * parsing, so peak memory tracks the widest single tag — measured at ~23x
	 * the tag's width — and a sub-1 MB buffer can still exhaust memory if one
	 * tag carries tens of thousands of attributes. The width check is the
	 * quote-blind pre-scan in find(), a best-effort bound rather than an
	 * exact one; at this ceiling the ordinary worst case is a few megabytes.
	 *
	 * @var int
	 */
	const MAX_TAG_BYTES = 100000;

	/**
	 * Find the byte offset of the buffer's last top-level closing body tag.
	 *
	 * The last one, not the first: the document's own closing tag follows any
	 * stray closer its content holds. Taking the last candidate is also what
	 * makes the walk self-correcting when the buffer begins inside a comment
	 * or raw-text region whose opening tag was flushed in an earlier output
	 * chunk: the tokenizer misreads that region's text as markup, but any
	 * false candidate it yields is overwritten as soon as the region ends and
	 * the document's real closing tag is reached. (This is why the walk must
	 * not stop early at a closing </html> tag — a false one inside such a
	 * region would freeze the false candidate. The cost is that a bare,
	 * uncontained '</body>' in trailing output after the document can shift
	 * the insertion point past the document's own tag; browsers reparent that
	 * trailing content into body, so the moved scripts still run.)
	 *
	 * When the buffer ends inside an unterminated token (an unclosed comment
	 * or raw-text region at the end of the window), the tokenizer stops
	 * without reporting anything from that region; a candidate found before
	 * it is still valid — it was reached as real markup — and no candidate
	 * means null and the append fallback.
	 *
	 * @param string $buffer HTML buffer.
	 *
	 * @return int|null Byte offset of the '<' of the closing body tag, or null when none was found.
	 */
	public static function find( $buffer ) {
		// The walk needs next_token(), which core added in 6.5. WordPress only
		// enforces the plugin's 'Requires at least' header at activation, so a
		// manual core downgrade can leave Boost active on an older core, where
		// calling it would fatal inside the output-buffer callback and blank
		// every page. (On cores without the class at all, method_exists()
		// returns false rather than erroring.)
		if ( ! method_exists( \WP_HTML_Tag_Processor::class, 'next_token' ) ) {
			return null;
		}

		// mbstring.func_overload (PHP 7.x only, removed in 8.0) rebinds strlen(),
		// strpos() and substr() to their multibyte counterparts. The offset
		// returned here feeds byte arithmetic (substr_replace), so on such a
		// host no position can be trusted.
		// phpcs:ignore PHPCompatibility.IniDirectives.RemovedIniDirectives.mbstring_func_overloadDeprecated,PHPCompatibility.IniDirectives.RemovedIniDirectives.mbstring_func_overloadDeprecatedRemoved -- Read, not set: the directive being deprecated and then removed on the supported range is exactly why this check exists.
		if ( 2 & (int) ini_get( 'mbstring.func_overload' ) ) {
			return null;
		}

		if ( strlen( $buffer ) > self::MAX_SCAN_BYTES ) {
			return null;
		}

		// Refuse a buffer whose widest '<'…'>' run exceeds MAX_TAG_BYTES.
		// The scan is quote-blind: a '>' inside a quoted attribute value ends
		// a run early, so this is a best-effort bound on the dense-attribute
		// shape rather than an exact tag width. Overcounts (comments, raw
		// text) only err towards the safe append fallback.
		$cursor = strpos( $buffer, '<' );
		while ( false !== $cursor ) {
			$close = strpos( $buffer, '>', $cursor + 1 );
			if ( false === $close ) {
				break;
			}
			if ( $close - $cursor > self::MAX_TAG_BYTES ) {
				return null;
			}
			$cursor = strpos( $buffer, '<', $close + 1 );
		}

		$processor = new Position_Aware_Tag_Processor( $buffer );
		$position  = null;
		$depths    = array_fill_keys( self::SKIPPED_CONTAINERS, 0 );

		while ( $processor->next_token() ) {
			if ( '#tag' !== $processor->get_token_type() ) {
				continue;
			}

			$name = $processor->get_token_name();
			if ( null === $name ) {
				continue;
			}

			if ( 'PLAINTEXT' === $name && ! $processor->is_tag_closer() ) {
				// Everything after a plaintext opener is text (the element
				// cannot be closed), but the tokenizer keeps reporting tokens
				// there — stop so none of them becomes a false candidate.
				break;
			}

			if ( isset( $depths[ $name ] ) ) {
				if ( $processor->is_tag_closer() ) {
					if ( $depths[ $name ] > 0 ) {
						--$depths[ $name ];
					}
				} elseif ( ! $processor->has_self_closing_flag() || ( 'SVG' !== $name && 'MATH' !== $name ) ) {
					// Foreign content honours the self-closing flag; on the
					// HTML elements (template, noscript) a browser ignores it
					// and opens the region anyway.
					++$depths[ $name ];
				}
				continue;
			}

			if ( array_sum( $depths ) > 0 || ! $processor->is_tag_closer() ) {
				continue;
			}

			if ( 'BODY' === $name ) {
				$position = $processor->get_token_byte_offset();
			}
		}

		return $position;
	}
}
