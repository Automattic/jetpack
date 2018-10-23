<?php
/**
 * Jetpack Compatibility File
 * See: http://jetpack.com/
 */

function twentynineteen_jetpack_setup() {

	/**
 	 * Add theme support for Infinite Scroll.
	 */
 	add_theme_support( 'infinite-scroll', array(
	 	'type'      => 'click',
 		'container' => 'main',
 		'render'    => 'twentynineteen_infinite_scroll_render',
 		'footer'    => 'page',
 	) );

 	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );

	/**
	 * Add theme support for geo-location.
	 */
	add_theme_support( 'jetpack-geo-location' );

	/**
	 * Add theme support for Content Options.
	 */
	add_theme_support( 'jetpack-content-options', array(
		'post-details'    => array(
			'stylesheet' => 'twentynineteen-style',
			'date'       => '.posted-on',
			'categories' => '.cat-links',
			'tags'       => '.tags-links',
			'author'     => '.byline',
			'comment'    => '.comments-link',
		),
		'featured-images' => array(
			'archive'    => true,
			'post'       => true,
			'page'       => true,
		),
	) );
}
add_action( 'after_setup_theme', 'twentynineteen_jetpack_setup' );

/**
 * Custom render function for Infinite Scroll.
 */
function twentynineteen_infinite_scroll_render() {
	while ( have_posts() ) {
		the_post();
		get_template_part( 'template-parts/content/content' );
	}
}

function twentynineteen_init_jetpack() {
	/**
	 * Add our compat CSS file for Infinit Scroll and custom widget stylings and such.
	 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production
	 * or skip it entirely for wpcom.
	 */
	if ( ! is_admin() ) {
		$version = false;
		if ( method_exists( 'Jetpack', 'is_development_version' ) ) {
			$version = Jetpack::is_development_version() ? filemtime( plugin_dir_path( __FILE__ ) . 'twentynineteen.css' ) : JETPACK__VERSION;
		}
		wp_enqueue_style( 'twentynineteen-jetpack', plugins_url( 'twentynineteen.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'twentynineteen-jetpack', 'rtl', 'replace' );
	}
}
add_action( 'init', 'twentynineteen_init_jetpack' );

/**
 * Alter gallery widget default width.
 */
function twentynineteen_gallery_widget_content_width( $width ) {
	return 390;
}
add_filter( 'gallery_widget_content_width', 'twentynineteen_gallery_widget_content_width' );
