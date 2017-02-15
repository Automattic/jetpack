<?php
/**
 * Content Options.
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
	add_theme_support( 'jetpack-content-options', array(
		'blog-display'       => 'content', // the default setting of the theme: 'content', 'excerpt' or array( 'content', 'excerpt' ) for themes mixing both display.
		'author-bio'         => true, // display or not the author bio: true or false.
		'author-bio-default' => false, // the default setting of the author bio, if it's being displayed or not: true or false (only required if false).
		'masonry'            => '.site-main', // a CSS selector matching the elements that triggers a masonry refresh if the theme is using a masonry layout.
		'post-details'       => array(
			'stylesheet'      => 'themeslug-style', // name of the theme's stylesheet.
			'date'            => '.posted-on', // a CSS selector matching the elements that display the post date.
			'categories'      => '.cat-links', // a CSS selector matching the elements that display the post categories.
			'tags'            => '.tags-links', // a CSS selector matching the elements that display the post tags.
			'author'          => '.byline', // a CSS selector matching the elements that display the post author.
		),
		'featured-images'    => array(
			'archive'         => true, // enable or not the featured image check for archive pages: true or false.
			'archive-default' => false, // the default setting of the featured image on archive pages, if it's being displayed or not: true or false (only required if false).
			'post'            => true, // enable or not the featured image check for single posts: true or false.
			'post-default'    => false, // the default setting of the featured image on single posts, if it's being displayed or not: true or false (only required if false).
			'page'            => true, // enable or not the featured image check for single pages: true or false.
			'page-default'    => false, // the default setting of the featured image on single pages, if it's being displayed or not: true or false (only required if false).
		),
	) );
 *
 */

/**
 * Activate the Content Options plugin.
 *
 * @uses current_theme_supports()
 */
function jetpack_content_options_init() {
	// If the theme doesn't support 'jetpack-content-options', don't continue.
	if ( ! current_theme_supports( 'jetpack-content-options' ) ) {
		return;
	}

	// Load the Customizer options.
	require( dirname( __FILE__ ) . '/content-options/customizer.php' );

	// Load Blog Display function.
	require( dirname( __FILE__ ) . '/content-options/blog-display.php' );

	// Load Author Bio function.
	require( dirname( __FILE__ ) . '/content-options/author-bio.php' );

	// Load Post Details function.
	require( dirname( __FILE__ ) . '/content-options/post-details.php' );

	// Load Featured Images function.
	if ( jetpack_featured_images_should_load() ) {
		require( dirname( __FILE__ ) . '/content-options/featured-images.php' );
	}
}
add_action( 'init', 'jetpack_content_options_init' );

function jetpack_featured_images_get_settings() {
	$options         = get_theme_support( 'jetpack-content-options' );
	$featured_images = ( ! empty( $options[0]['featured-images'] ) ) ? $options[0]['featured-images'] : null;

	$settings        = array(
		'archive'         => ( ! empty( $featured_images['archive'] ) ) ? $featured_images['archive'] : null,
		'post'            => ( ! empty( $featured_images['post'] ) ) ? $featured_images['post'] : null,
		'page'            => ( ! empty( $featured_images['page'] ) ) ? $featured_images['page'] : null,
		'archive-default' => ( isset( $featured_images['archive-default'] ) && false === $featured_images['archive-default'] ) ? '' : 1,
		'post-default'    => ( isset( $featured_images['post-default'] ) && false === $featured_images['post-default'] ) ? '' : 1,
		'page-default'    => ( isset( $featured_images['page-default'] ) && false === $featured_images['page-default'] ) ? '' : 1,
	);

	$settings        = array_merge( $settings, array(
		'archive-option'  => get_option( 'jetpack_content_featured_images_archive', $settings['archive-default'] ),
		'post-option'     => get_option( 'jetpack_content_featured_images_post', $settings['post-default'] ),
		'page-option'     => get_option( 'jetpack_content_featured_images_page', $settings['page-default'] ),
	) );

	return $settings;
}

function jetpack_featured_images_should_load() {
	$opts = jetpack_featured_images_get_settings();

	// If the theme doesn't support archive, post and page or if all the options are ticked, don't continue.
	if ( ( true !== $opts['archive'] && true !== $opts['post'] && true !== $opts['page'] )
		|| ( 1 === $opts['archive-option'] && 1 === $opts['post-option'] && 1 === $opts['page-option'] ) ) {
		return false;
	}

	return true;
}
