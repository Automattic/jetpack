<?php

// exit unless in WP
if ( ! defined('ABSPATH') ) {
	exit;
}

add_filter( 'jetpack_get_available_modules', function( $modules, $min_version, $max_version ) {
	$modules['comment-likes'] = '5.1';
	return $modules;
}, 10, 3 );

add_filter( 'jetpack_get_module_path', function( $path, $slug ) {
	if ( 'comment-likes' === $slug ) {
		return dirname( __FILE__ ) . '/legacy/comment-likes.php';
	}
	return $path;
}, 10, 2 );

/**
 * This is from modules/module-info.php
 */

/**
 * Comment Likes support link.
 */
add_action( 'jetpack_learn_more_button_comment-likes', function() {
	echo 'https://jetpack.com/support/comment-likes/';
} );

/**
 * Comment Likes description.
 */
add_action( 'jetpack_module_more_info_comment-likes', function() {
	esc_html_e(
		'Increase visitor engagement by adding a Like button to comments.',
		'jetpack'
	);
} );

/**
 * This is from class.jetpack.php
 */
/**
 * Removed from class.jetpack.php:
 *
 * 'comment-likes' => array(
 *			'Epoch'                                => 'epoch/plugincore.php',
 *		),
 */
add_filter( 'jetpack_module_conflicting_plugins', function( $conflicts, $module_slug ) {
	if ( 'comment-likes' === $module_slug ) {
		$conflicts['Epoch'] = 'epoch/plugincore.php';
	}
	return $conflicts;
});