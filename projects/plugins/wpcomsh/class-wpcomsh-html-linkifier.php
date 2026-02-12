<?php
/**
 * Wpcomsh HTML Linkifier
 *
 * Extends WP_HTML_Tag_Processor to expose token byte positions via bookmarks.
 *
 * @package wpcomsh
 */

/**
 * Extends WP_HTML_Tag_Processor to expose current token byte positions.
 *
 * The token position fields (token_starts_at, token_length) are private in
 * WP_HTML_Tag_Processor. This subclass uses the protected bookmarks property
 * to expose the current token's start offset and length.
 */
class Wpcomsh_HTML_Linkifier extends WP_HTML_Tag_Processor {

	/**
	 * Get the byte offset and length of the current token in the HTML string.
	 *
	 * Uses set_bookmark() to capture the position, reads it from the protected
	 * bookmarks array, then releases the bookmark.
	 *
	 * @return array{0: int, 1: int}|null Array of [start, length] or null on failure.
	 */
	public function get_token_position() {
		$bookmark_name = '_wpcomsh_pos';

		if ( ! $this->set_bookmark( $bookmark_name ) ) {
			return null;
		}

		$bookmark = $this->bookmarks[ $bookmark_name ];
		$position = array( $bookmark->start, $bookmark->length );

		// Release to stay under MAX_BOOKMARKS limit defined in WP_HTML_Tag_Processor.
		$this->release_bookmark( $bookmark_name );

		return $position;
	}
}
