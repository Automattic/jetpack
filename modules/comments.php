<?php

/**
 * Module Name: Jetpack Comments
 * Module Description: A new comment system that has integrated social media login options.
 * First Introduced: 1.4
 * Sort Order: 2
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
