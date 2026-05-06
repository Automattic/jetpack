<?php
/**
 * Test stub: declare has_blog_sticker so wpcom_has_blog_sticker reports true
 * only for the big-sky-enabled sticker. Loaded only inside isolated test
 * processes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'has_blog_sticker' ) ) {
	/**
	 * @param string $sticker Sticker name.
	 * @param int    $blog_id Blog ID.
	 * @return bool
	 */
	function has_blog_sticker( $sticker, $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $sticker === 'big-sky-enabled';
	}
}
