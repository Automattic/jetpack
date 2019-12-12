<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package Jetpack
 */

/**
 * Add Jetpack extra functionality to Twenty Twenty.
 *
 * See: https://jetpack.com/support/infinite-scroll/
 * See: https://jetpack.com/support/responsive-videos/
 * See: https://jetpack.com/support/content-options/
 */
function twentytwenty_jetpack_setup() {
	/**
	 * Add theme support for Infinite Scroll.
	 */
	add_theme_support(
		'infinite-scroll',
		array(
			'type'           => 'click',
			'container'      => 'site-content',
			'render'         => 'twentytwenty_infinite_scroll_render',
			'footer'         => 'site-content',
			'footer_widgets' => array(
				'sidebar-1',
				'sidebar-2',
			),
		)
	);

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

	// Social Menu.
	add_theme_support( 'jetpack-social-menu', 'svg' );

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
 * We do not need to display the Likes Heading here.
 *
 * @param string $heading Headline structure.
 * @param string $title   Title.
 * @param string $module  Module name.
 */
function twentytwenty_no_likes_heading( $heading, $title, $module ) {
	if ( 'likes' === $module ) {
		return '';
	}

	return $heading;
}
add_filter( 'jetpack_sharing_headline_html', 'twentytwenty_no_likes_heading', 10, 3 );

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

/**
 * Add inline custom CSS with custom accent color if there is any set.
 */
function twentytwenty_infinity_accent_color_css() {
	// Bail early if no custom color was set.
	if (
		'custom' !== get_theme_mod( 'accent_hue_active' )
		|| empty( get_theme_mod( 'accent_accessible_colors' ) )
	) {
		return;
	}

	$color_info = get_theme_mod( 'accent_accessible_colors' );
	$custom_css = sprintf(
		'
		.infinite-scroll #site-content #infinite-handle span button,
		.infinite-scroll #site-content #infinite-handle span button:hover,
		.infinite-scroll #site-content #infinite-handle span button:focus {
			background: %1$s;
			color: %2$s;
		}
		#site-content .entry-content div.sharedaddy h3.sd-title,
		#site-content .entry-content h3.sd-title,
		#site-content .entry-content #jp-relatedposts h3.jp-relatedposts-headline {
			color: %3$s;
		}
		',
		$color_info['content']['accent'],
		$color_info['content']['background'],
		$color_info['content']['secondary']
	);

	// Add our custom style to the existing Twenty Twenty CSS compat file.
	wp_add_inline_style( 'twentytwenty-jetpack', $custom_css );
}
add_action( 'wp_enqueue_scripts', 'twentytwenty_infinity_accent_color_css' );
