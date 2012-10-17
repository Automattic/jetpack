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
 * Sets the post excerpt length to 40 words.
 *
 * To override this length in a child theme, remove the filter and add your own
 * function tied to the excerpt_length filter hook.
 */
function minileven_excerpt_length( $length ) {
	return 40;
}
add_filter( 'excerpt_length', 'minileven_excerpt_length' );

/**
 * Returns a "Continue Reading" link for excerpts
 */
function minileven_continue_reading_link() {
	return ' <a href="'. esc_url( get_permalink() ) . '">' . __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'jetpack' ) . '</a>';
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