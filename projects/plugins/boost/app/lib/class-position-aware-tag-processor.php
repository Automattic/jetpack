<?php
/**
 * A WP_HTML_Tag_Processor subclass that can report where the current token starts.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Exposes the byte offset of the current token.
 *
 * WP_HTML_Tag_Processor tracks token positions internally but its public API
 * does not expose them. The bookmark API does: set_bookmark() stores the
 * current token's span as a WP_HTML_Span, the $bookmarks property is
 * protected, and WP_HTML_Span::$start is public — so a subclass can read the
 * offset without touching any private state. The same access pattern is
 * already used elsewhere in the monorepo (wpcomsh's WPCOMSH_HTML_Linkifier).
 *
 * The scan must stay read-only: byte offsets refer to the original input
 * string, so no lexical updates (set_attribute() and friends) may be enqueued
 * by users of this class.
 *
 * @since $$next-version$$
 */
class Position_Aware_Tag_Processor extends \WP_HTML_Tag_Processor {

	/**
	 * Single reusable bookmark name, released after every read so the
	 * processor's bookmark limit (10) is never approached.
	 *
	 * @var string
	 */
	const BOOKMARK = 'jetpack_boost_position';

	/**
	 * Byte offset in the original HTML where the current token starts.
	 *
	 * @return int|null Byte offset of the token's first byte ('<' for a tag), or null when there is no current token.
	 */
	public function get_token_byte_offset() {
		if ( ! $this->set_bookmark( self::BOOKMARK ) ) {
			return null;
		}

		$start = $this->bookmarks[ self::BOOKMARK ]->start;
		$this->release_bookmark( self::BOOKMARK );

		return $start;
	}
}
