<?php
add_action( 'bbp_init', 'jetpack_bbpress_compat' );

/**
 * Adds Jetpack + bbPress Compatability filters.
 *
 * Runs on the `bbp_init` hook as an easy way to determine if bbPress is active.
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