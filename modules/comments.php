<?php

/**
 * Module Name: Comments
 * Module Description: Let readers use WordPress.com, Twitter, Facebook, or Google+ accounts to comment
 * First Introduced: 1.4
 * Sort Order: 20
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social
 * Feature: Engagement
 * Additional Search Queries: comments, comment, facebook, twitter, google+, social
 */

require dirname( __FILE__ ) . '/comments/comments.php';

if ( is_admin() ) {
	require dirname( __FILE__ ) . '/comments/admin.php';
}

function jetpack_comments_load() {
	Jetpack::enable_module_configurable( __FILE__ );
}

add_action( 'jetpack_modules_loaded', 'jetpack_comments_load' );

Jetpack::dns_prefetch( array(
	'//jetpack.wordpress.com',
	'//s0.wp.com',
	'//s1.wp.com',
	'//s2.wp.com',
	'//public-api.wordpress.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );
