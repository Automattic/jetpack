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
	// The hook fires again for each editor iframe, which shares this registration.
	if ( ! wp_style_is( 'wpcom-hide-non-breaking-space-markers', 'registered' ) ) {
		wp_register_style( 'wpcom-hide-non-breaking-space-markers', false, array(), '1.0' );
		// !important because concatenated or copied sheets can print Gutenberg's rule after this one.
		wp_add_inline_style( 'wpcom-hide-non-breaking-space-markers', '.is-selected .non-breaking-space{background:none!important;outline:none!important;opacity:1!important}' );
	}
	wp_enqueue_style( 'wpcom-hide-non-breaking-space-markers' );
}
add_action( 'enqueue_block_assets', 'wpcom_hide_non_breaking_space_markers' );
