<?php
/**
 * Custom functions that act independently of the theme templates
 *
 * Eventually, some of the functionality here could be replaced by core features
 *
 * @package Minileven
 * @since Minileven 2.0
 */

/**
* Sets the post excerpt length based on number of characters, without breaking words at the end
*
*/
function minileven_excerpt( $count ) {
	$excerpt = get_the_content();
	$excerpt = strip_tags( $excerpt );
	$excerpt = strip_shortcodes( $excerpt );
	$excerpt = substr( $excerpt, 0, $count );
	$excerpt = substr( $excerpt, 0, strripos( $excerpt, " " ) );
	$excerpt = $excerpt . minileven_continue_reading_link();
	return $excerpt;
}
/**

/**
 * Returns a "Continue Reading" link for excerpts
 */
function minileven_continue_reading_link() {
	return ' &hellip; <a href="'. esc_url( get_permalink() ) . '">' . __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'jetpack' ) . '</a>';
}

/**
 * Replaces "[...]" (appended to automatically generated excerpts) with an ellipsis and minileven_continue_reading_link().
 */
function minileven_auto_excerpt_more( $more ) {
	return ' &hellip;' . minileven_continue_reading_link();
}
add_filter( 'excerpt_more', 'minileven_auto_excerpt_more' );

/**
 * Adds a pretty "Continue Reading" link to custom post excerpts.
 *
 * To override this link in a child theme, remove the filter and add your own
 * function tied to the get_the_excerpt filter hook.
 */
function minileven_custom_excerpt_more( $output ) {
	if ( has_excerpt() && ! is_attachment() ) {
		$output .= minileven_continue_reading_link();
	}
	return $output;
}
add_filter( 'get_the_excerpt', 'minileven_custom_excerpt_more' );

/**
 * Get our wp_nav_menu() fallback, wp_page_menu(), to show a home link.
 */
function minileven_page_menu_args( $args ) {
	$args['show_home'] = true;
	return $args;
}
add_filter( 'wp_page_menu_args', 'minileven_page_menu_args' );

/**
 * Adds a custom class to the array of body classes, to allow Minileven to be targeted with Custom CSS.
 */
function minileven_body_classes( $classes ) {
	$classes[] = 'mobile-theme';
	return $classes;
}
add_filter( 'body_class', 'minileven_body_classes' );

/**
 * Filters wp_title to print a neat <title> tag based on what is being viewed.
 *
 * @since Minileven 2.0
 */
function minileven_wp_title( $title, $sep ) {
	global $page, $paged;

	if ( is_feed() )
		return $title;

	// Add the blog name
	$title .= get_bloginfo( 'name' );

	// Add the blog description for the home/front page.
	$site_description = get_bloginfo( 'description', 'display' );
	if ( $site_description && ( is_home() || is_front_page() ) )
		$title .= " $sep $site_description";

	// Add a page number if necessary:
	if ( $paged >= 2 || $page >= 2 )
		$title .= " $sep " . sprintf( __( 'Page %s', 'jetpack' ), max( $paged, $page ) );

	return $title;
}
add_filter( 'wp_title', 'minileven_wp_title', 10, 2 );

/**
 * Add theme support for Responsive Videos.
 */
add_theme_support( 'jetpack-responsive-videos' );