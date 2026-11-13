<?php
/**
 * Hide the block editor's non-breaking space markers on sites that opt out of them.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Reset the marker Gutenberg draws on non-breaking spaces in the selected block, for sites with the
 * `hide-non-breaking-space-markers` blog sticker.
 */
function wpcom_hide_non_breaking_space_markers() {
	if ( ! is_admin() || ! wpcom_has_blog_sticker( 'hide-non-breaking-space-markers', get_wpcom_blog_id() ) ) {
		return;
	}

	// Opt-in accommodation overriding the marker in Gutenberg's rich-text/content.scss (a dot from 24.3,
	// an outline before); drop it once Gutenberg ships its own preference to hide the markers.
	wp_register_style( 'wpcom-hide-non-breaking-space-markers', false, array( 'wp-block-editor-content' ), '1.0' );
	wp_enqueue_style( 'wpcom-hide-non-breaking-space-markers' );
	wp_add_inline_style( 'wpcom-hide-non-breaking-space-markers', '.is-selected .non-breaking-space{background:none;outline:none;opacity:1}' );
}
add_action( 'enqueue_block_assets', 'wpcom_hide_non_breaking_space_markers' );
