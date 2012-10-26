<?php
/**
 * Module Name: Mobile Push Notifications
 * Module Description: Receive notifications on your Apple device.
 * Sort Order: 100
 * First Introduced: 1.9
 */

add_action( 'jetpack_modules_loaded', 'jetpack_mobile_push_load' );
 
function jetpack_mobile_push_load() {
	Jetpack_Sync::sync_comments( __FILE__, array(
		'comment_stati' => array( 'approved', 'unapproved' ),
	) );
}
