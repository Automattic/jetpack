<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package Jetpack
 */

/**
 * Add Jetpack extra functionality to Twenty Twenty.
 */
function twentytwenty_jetpack_setup() {
	/**
	 * Add theme support for Infinite Scroll.
	 */
	add_theme_support(
		'infinite-scroll',
		array(
			'type'      => 'click',
			'container' => 'site-content',
			'render'    => 'twentytwenty_infinite_scroll_render',
			'footer'    => 'site-content',
		)
	);

	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );

	/**
	 * Add theme support for geo-location.
	 */
	add_theme_support( 'jetpack-geo-location' );
}
add_action( 'after_setup_theme', 'twentytwenty_jetpack_setup' );

/**
 * Custom render function for Infinite Scroll.
 */
function twentytwenty_infinite_scroll_render() {
	while ( have_posts() ) {
		echo '<hr class="post-separator styled-separator is-style-wide section-inner" aria-hidden="true" />';
		the_post();
		get_template_part( 'template-parts/content', get_post_type() );
	}
}

/**
 * Remove Sharing buttons and Likes from excerpts that are used as intro on single post views.
 */
function twentytwenty_no_sharing_on_excerpts() {
	if ( is_single() ) {
		// Remove sharing buttons.
		remove_filter( 'the_excerpt', 'sharing_display', 19 );

		// Remove Likes.
		if ( class_exists( 'Jetpack_Likes' ) ) {
			remove_filter( 'the_excerpt', array( Jetpack_Likes::init(), 'post_likes' ), 30, 1 );
		}
	}
}
add_action( 'loop_start', 'twentytwenty_no_sharing_on_excerpts' );

/**
 * Disable Ads in post excerpts, that are used as intro on single post views.
 */
add_filter( 'wordads_excerpt_disable', '__return_true' );

/**
 * Add our compat CSS file for Infinite Scroll and custom widget stylings and such.
 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production
 * or skip it entirely for wpcom.
 */
function twentytwenty_enqueue_jetpack_style() {
	$version = Jetpack::is_development_version()
		? filemtime( JETPACK__PLUGIN_DIR . 'modules/theme-tools/compat/twentytwenty.css' )
		: JETPACK__VERSION;

	wp_enqueue_style( 'twentytwenty-jetpack', plugins_url( 'twentytwenty.css', __FILE__ ), array(), $version );
	wp_style_add_data( 'twentytwenty-jetpack', 'rtl', 'replace' );
}
add_action( 'wp_enqueue_scripts', 'twentytwenty_enqueue_jetpack_style' );

