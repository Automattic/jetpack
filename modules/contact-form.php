<?php
/**
 * Module Name: Contact Form
 * Module Description: Insert a contact form anywhere on your site.
 * Jumpstart Description: adds a button to your post and page editors, allowing you to build simple forms to help visitors stay in touch.
 * Sort Order: 15
 * Recommendation Order: 14
 * First Introduced: 1.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Other, Jumpstart
 */

include dirname( __FILE__ ) . '/contact-form/grunion-contact-form.php';

Jetpack_Sync::sync_posts( __FILE__, array(
	'post_types' => array( 'feedback' ),
) );
