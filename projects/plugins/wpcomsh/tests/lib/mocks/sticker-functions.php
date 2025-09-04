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
			return $test_has_blog_sticker_args['sticker'] === $sticker && $test_has_blog_sticker_args['blog_id'] === $blog_id;
		}

		return isset( $test_has_blog_sticker_return ) ? $test_has_blog_sticker_return : false;
	}
}
