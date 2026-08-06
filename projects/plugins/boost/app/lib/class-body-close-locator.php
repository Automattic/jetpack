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
 * @since $$next-version$$
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
	 * Find the byte offset of the buffer's last top-level closing body tag.
	 *
	 * The last one, not the first: the document's own closing tag follows any
	 * stray closer its content holds. The walk stops at the closing </html>
	 * tag once a candidate exists, so trailing output a host or plugin emits
	 * after the document can never replace the document's own answer.
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
		// Belt-and-braces: the HTML API ships with every WordPress version
		// Boost supports, so this only guards truly broken installs.
		if ( ! class_exists( \WP_HTML_Tag_Processor::class ) ) {
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
			} elseif ( 'HTML' === $name && null !== $position ) {
				// The document is over; nothing after its closing tag can
				// improve on the answer.
				break;
			}
		}

		return $position;
	}
}
