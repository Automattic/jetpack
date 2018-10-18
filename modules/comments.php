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
	Jetpack::module_configuration_load( __FILE__, 'jetpack_comments_configuration_load' );
}

function jetpack_comments_configuration_load() {
	wp_safe_redirect( admin_url( 'options-discussion.php#jetpack-comments-settings' ) );
	exit;
}

add_action( 'jetpack_modules_loaded', 'jetpack_comments_load' );

function jetpack_dns_prefetch( $urls, $relation_type ) {
	if( 'dns-prefetch' == $relation_type ) {
		$urls[] = '//jetpack.wordpress.com'; 
		$urls[] = '//s0.wp.com';
		$urls[] = '//s1.wp.com';
		$urls[] = '//s2.wp.com';
		$urls[] = '//public-api.wordpress.com';
		$urls[] = '//0.gravatar.com';
		$urls[] = '//1.gravatar.com';
		$urls[] = '//2.gravatar.com';
	}
	return $urls;
}

add_filter( 'wp_resource_hints', 'jetpack_resource_hints', 10, 2 );
