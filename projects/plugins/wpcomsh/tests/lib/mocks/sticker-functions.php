<?php
/**
 * Mock sticker functions for testing
 *
 * @package wpcomsh
 */

// Mock has_blog_sticker function for testing
if ( ! function_exists( 'has_blog_sticker' ) ) {
	/**
	 * Mock has_blog_sticker function.
	 *
	 * @param string $sticker  The sticker name.
	 * @param int    $blog_id  The blog ID.
	 * @return bool Whether the sticker is active.
	 */
	function has_blog_sticker( $sticker, $blog_id ) {
		global $test_has_blog_sticker_return;
		global $test_has_blog_sticker_args;

		if ( isset( $test_has_blog_sticker_args ) && is_array( $test_has_blog_sticker_args ) ) {
			$sticker_match = $test_has_blog_sticker_args['sticker'] === $sticker;
			// Convert both values to string for comparison to handle type differences
			$blog_id_match = (string) $test_has_blog_sticker_args['blog_id'] === (string) $blog_id;

			return $sticker_match && $blog_id_match;
		}

		return isset( $test_has_blog_sticker_return ) ? $test_has_blog_sticker_return : false;
	}
}
