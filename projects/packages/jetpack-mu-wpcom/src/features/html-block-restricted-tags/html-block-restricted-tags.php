<?php
/**
 * Displays a warning message when the user tries to insert a custom HTML block with restricted tags.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Enqueue assets
 */
function wpcom_enqueue_html_block_restricted_tags_assets() {
	// Atomic sites don't have tags restrictions.
	if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
		return;
	}

	jetpack_mu_wpcom_enqueue_assets( 'html-block-restricted-tags', array( 'js' ) );
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_html_block_restricted_tags_assets' );
