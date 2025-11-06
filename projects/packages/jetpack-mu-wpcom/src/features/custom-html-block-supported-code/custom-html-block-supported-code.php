<?php
/**
 * Displays a warning message when the user tries to insert a custom HTML block with unsupported code.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Enqueue assets
 */
function wpcom_enqueue_custom_html_block_supported_code_assets() {
	// Atomic sites don't have code restrictions.
	if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
		return;
	}

	jetpack_mu_wpcom_enqueue_assets( 'custom-html-block-supported-code', array( 'js' ) );
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_custom_html_block_supported_code_assets' );
