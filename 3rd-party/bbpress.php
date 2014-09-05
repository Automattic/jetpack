<?php

add_action( 'bbp_get_topic_content', 'bbpress_jetpack_sharing_display');
add_action( 'bbp_template_before_single_forum', 'bbpress_jetpack_sharing_display' );
add_action( 'bbp_template_before_single_topic', 'bbpress_jetpack_sharing_display' );
add_action( 'bbp_template_before_lead_topic', 'bbpress_jetpack_sharing_display' );

/**
* Display Jetpack "Sharing" buttons on bbPress 2.x forums/ topics/ lead topics/ replies.
*/
function bbpress_jetpack_sharing_display() {
	if ( function_exists( 'sharing_display' ) ) {
 		echo sharing_display();
	} 	
}
