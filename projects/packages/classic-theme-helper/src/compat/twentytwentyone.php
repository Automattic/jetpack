<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack-classic-theme-helper
 */

/**
 * Add Jetpack extra functionality to Twenty Twenty One.
 */
function twentytwentyone__jetpack_setup() {

	/**
	 * Add theme support for Content Options.
	 */
	add_theme_support(
		'jetpack-content-options',
		array(
			'blog-display'    => array( 'content', 'excerpt' ),
			'post-details'    => array(
				'stylesheet' => 'twenty-twenty-one-style',
				'date'       => '.posted-on',
				'categories' => '.cat-links',
			),
			'featured-images' => array(
				'archive' => true,
				'post'    => true,
				'page'    => true,
			),
		)
	);
}
add_action( 'after_setup_theme', 'twentytwentyone__jetpack_setup' );
