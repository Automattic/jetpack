<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Compatibility helpers for post excerpts.
 *
 * Auto-generated excerpts run post content through `the_content`, then `wp_trim_words()`
 * calls `wp_strip_all_tags()`. PHP `strip_tags()` removes `<br>` without inserting a
 * word boundary, so text like "This is<br/>an example" becomes "This isan example".
 *
 * @package automattic/jetpack
 */

/**
 * Replace `<br>` tags with spaces in post content when building an auto excerpt.
 *
 * Runs late on `the_content` so wpautop and other filters have already run, but before
 * `wp_trim_excerpt()` passes the string to `wp_trim_words()` / `wp_strip_all_tags()`.
 *
 * @param string $content Filtered post content HTML.
 * @return string
 */
function jetpack_excerpt_br_tags_to_spaces_in_the_content( $content ) {
	if ( ! doing_filter( 'get_the_excerpt' ) ) {
		return $content;
	}

	return preg_replace( '/<br\b[^>]*\/?>/i', ' ', $content );
}

add_filter( 'the_content', 'jetpack_excerpt_br_tags_to_spaces_in_the_content', PHP_INT_MAX - 10 );
