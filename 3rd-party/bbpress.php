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

	/**
	 * Enable Markdown support for bbpress post types.
	 *
	 * @author Brandon Kraft
	 * @since 6.0.0
	 */
	 if ( function_exists( 'bbp_get_topic_post_type' ) ) {
		 add_post_type_support( bbp_get_topic_post_type(), 'wpcom-markdown' );
		 add_post_type_support( bbp_get_reply_post_type(), 'wpcom-markdown' );
		 add_post_type_support( bbp_get_forum_post_type(), 'wpcom-markdown' );
	 }

	/**
	 * Use Photon for all images in Topics and replies.
	 *
	 * @since 4.9.0
	 */
	if ( class_exists( 'Jetpack_Photon' ) && Jetpack::is_module_active( 'photon' ) ) {
		add_filter( 'bbp_get_topic_content', array( 'Jetpack_Photon', 'filter_the_content' ), 999999 );
		add_filter( 'bbp_get_reply_content', array( 'Jetpack_Photon', 'filter_the_content' ), 999999 );
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
