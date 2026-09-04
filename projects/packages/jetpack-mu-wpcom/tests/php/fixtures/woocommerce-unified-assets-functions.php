<?php
/**
 * Platform function doubles for the WooCommerce unified assets rollout tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check whether the requested test sticker is active.
 *
 * @param string $sticker The blog sticker.
 * @param int    $blog_id The blog ID.
 * @return bool Whether the sticker is active.
 */
function has_blog_sticker( $sticker, $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return in_array( $sticker, $GLOBALS['jetpack_mu_wpcom_test_blog_stickers'], true );
}
