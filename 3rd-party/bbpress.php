<?php
add_action( 'init', 'jetpack_bbpress_compat', 11 ); // Priority 11 needed to ensure sharing_display is loaded.

/**
 * Adds Jetpack + bbPress Compatibility filters.
 *
 * @author Brandon Kraft
 * @since  3.7.1
 */
function jetpack_bbpress_compat() {
	if ( function_exists( 'sharing_display' ) ) {
		add_filter( 'bbp_get_topic_content',           'sharing_display', 19 );
		add_action( 'bbp_template_after_single_forum', 'jetpack_sharing_bbpress' );
		add_action( 'bbp_template_after_single_topic', 'jetpack_sharing_bbpress' );
	}
}

/**
 * Display Jetpack "Sharing" buttons on bbPress 2.x forums/ topics/ lead topics/ replies.
 *
 * Determination if the sharing buttons should display on the post type is handled within sharing_display().
 *
 * @author David Decker
 * @since  3.7.0
 */
function jetpack_sharing_bbpress() {
	sharing_display( null, true );
}