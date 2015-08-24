<?php

add_action( 'bbp_get_topic_content',           'jetpack_sharing_bbpress' );
add_action( 'bbp_template_after_single_forum', 'jetpack_sharing_bbpress' );
add_action( 'bbp_template_after_single_topic', 'jetpack_sharing_bbpress' );
add_action( 'bbp_template_after_lead_topic',   'jetpack_sharing_bbpress' );

/**
 * Display Jetpack "Sharing" buttons on bbPress 2.x forums/ topics/ lead topics/ replies.
 *
 * Determination if the sharing buttons should display on the post type is handled within sharing_display().
 *
 * @author David Decker
 * @since  3.6.0
 */
function jetpack_sharing_bbpress() {

	if ( function_exists( 'sharing_display' ) ) {
		echo sharing_display();
	}
}