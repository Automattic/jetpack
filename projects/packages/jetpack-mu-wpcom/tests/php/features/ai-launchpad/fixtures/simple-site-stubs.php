<?php
/**
 * Stubs for the WordPress.com Simple-only functions the AI Launchpad reaches for.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'get_blog_lang_code' ) ) {
	/**
	 * The blog's own language code, as WordPress.com Simple defines it.
	 *
	 * Returns '' by default, which is both what a blog with no language set returns and what keeps
	 * every other suite on the Atomic/self-hosted path. A test opts into Simple by setting
	 * `$GLOBALS['wpcom_ai_launchpad_test_blog_lang']`.
	 *
	 * @param int $blog_id Unused; the stub only ever describes the current blog.
	 * @return string
	 */
	function get_blog_lang_code( $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $GLOBALS['wpcom_ai_launchpad_test_blog_lang'] ?? '';
	}
}
