<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package Jetpack
 */

/**
 * Add Jetpack extra functionality to Twenty Twenty One.
 */
function twentytwentyone_jetpack_setup() {
	/**
	 * Add theme support for geo-location.
	 */
	add_theme_support( 'jetpack-geo-location' );

	/**
	 * Add theme support for Content Options.
	 */
	add_theme_support( 'jetpack-content-options', array(
		'blog-display' => array( 'content', 'excerpt' ),
    	'post-details' => array(
			'stylesheet' => 'twentytwentyone-style',
			'date'       => '.posted-on',
			'categories' => '.cat-links',
		),
		'featured-images'    => array(
			'archive'  => true,
			'post'     => true,
			'page'     => true,
		),
	) );
}
add_action( 'after_setup_theme', 'twentytwentyone_jetpack_setup' );

/**
 * Add our compat CSS file for custom styles.
 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production
 * or skip it entirely for wpcom.
 */
function twentytwentyone_enqueue_jetpack_style() {
	$version = Jetpack::is_development_version()
		? filemtime( JETPACK__PLUGIN_DIR . 'modules/theme-tools/compat/twentytwentyone.css' )
		: JETPACK__VERSION;

	wp_enqueue_style( 'twentytwentyone-jetpack', plugins_url( 'twentytwentyone.css', __FILE__ ), array(), $version );
	wp_style_add_data( 'twentytwentyone-jetpack', 'rtl', 'replace' );
}
add_action( 'wp_enqueue_scripts', 'twentytwentyone_enqueue_jetpack_style' );
