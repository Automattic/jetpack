<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack-classic-theme-helper
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Add Jetpack extra functionality to Twenty Twenty.
 *
 * See: https://jetpack.com/support/infinite-scroll/
 * See: https://jetpack.com/support/responsive-videos/
 * See: https://jetpack.com/support/content-options/
 */
function twentytwenty__jetpack_setup() {

	// Add theme support for Content Options.
	add_theme_support(
		'jetpack-content-options',
		array(
			'post-details'    => array(
				'stylesheet' => 'twentytwenty-style',
				'date'       => '.post-date',
				'categories' => '.entry-categories',
				'tags'       => '.post-tags',
				'author'     => '.post-author',
			),
			'featured-images' => array(
				'archive'  => true,
				'post'     => true,
				'page'     => true,
				'fallback' => false,
			),
		)
	);
}
add_action( 'after_setup_theme', 'twentytwenty__jetpack_setup' );
