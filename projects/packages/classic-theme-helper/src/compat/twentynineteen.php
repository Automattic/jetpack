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
 * Add Jetpack theme supports for Twenty Nineteen.
 */
function twentynineteen__jetpack_setup() {

	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );

	/**
	 * Add theme support for Content Options.
	 */
	add_theme_support(
		'jetpack-content-options',
		array(
			'blog-display'    => array( 'content', 'excerpt' ),
			'post-details'    => array(
				'stylesheet' => 'twentynineteen-style',
				'date'       => '.posted-on',
				'categories' => '.cat-links',
				'tags'       => '.tags-links',
				'author'     => '.byline',
				'comment'    => '.comments-link',
			),
			'featured-images' => array(
				'archive' => true,
				'post'    => true,
				'page'    => true,
			),
		)
	);
}
add_action( 'after_setup_theme', 'twentynineteen__jetpack_setup' );

if ( ! function_exists( 'twentynineteen_override_post_thumbnail' ) ) {
	/**
	 * Alter featured-image default visibility for content-options.
	 */
	function twentynineteen_override_post_thumbnail() {
		$options         = get_theme_support( 'jetpack-content-options' );
		$featured_images = ( ! empty( $options[0]['featured-images'] ) ) ? $options[0]['featured-images'] : null;

		$settings = array(
			'post-default' => ( isset( $featured_images['post-default'] ) && false === $featured_images['post-default'] ) ? '' : 1,
			'page-default' => ( isset( $featured_images['page-default'] ) && false === $featured_images['page-default'] ) ? '' : 1,
		);

		$settings = array_merge(
			$settings,
			array(
				'post-option' => get_option( 'jetpack_content_featured_images_post', $settings['post-default'] ),
				'page-option' => get_option( 'jetpack_content_featured_images_page', $settings['page-default'] ),
			)
		);

		if ( ( ! $settings['post-option'] && is_single() )
		|| ( ! $settings['page-option'] && is_singular() && is_page() ) ) {
			return false;
		} else {
			return ! post_password_required() && ! is_attachment() && has_post_thumbnail();
		}
	}
	add_filter( 'twentynineteen_can_show_post_thumbnail', 'twentynineteen_override_post_thumbnail', 10, 2 );
}
