<?php

// exit unless in WP
if ( ! defined('ABSPATH') ) {
	exit;
}

add_filter( 'jetpack_get_available_modules', function( $modules, $min_version, $max_version ) {
	$modules['likes'] = '2.2';
	return $modules;
}, 10, 3 );

add_filter( 'jetpack_get_module_path', function( $path, $slug ) {
	if ( 'likes' === $slug ) {
		return dirname( __FILE__ ) . '/legacy/likes.php';
	}
	return $path;
}, 10, 2 );

/**
 * This is from modules/module-info.php
 */

/**
 * Likes support link.
 */
add_action( 'jetpack_learn_more_button_likes', function() {
	echo 'https://jetpack.com/support/likes/';
} );

/**
 * Comment Likes description.
 */
add_action( 'jetpack_module_more_info_likes', function() {
	esc_html_e(
		'Allow your readers to show their appreciation for your posts and other content. Likes show up
		below each post and your readers will also be able to review their liked posts from WordPress.com.',
		'jetpack'
	);
} );