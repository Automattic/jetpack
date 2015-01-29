<?php
/**
 * Plugin Name: Site Breadcrumbs
 * Plugin URI: http://wordpress.com
 * Description: Quickly add breadcrumbs to the single view of a hierarchical post type
 * Author: Automattic
 * Version: 1.0
 * Author URI: http://wordpress.com
 * License: GPL2 or later
 */

function jetpack_breadcrumbs() {
	if ( ! is_page() || is_front_page() ) {
		return;
	}

	global $post;

	$ancestors = array_reverse( get_post_ancestors( $post->ID ) );

	$before = '<nav class="entry-breadcrumbs">';
	$after = '</nav>';

	$home = '<a href="' . esc_url( home_url( "/" ) ) . '" class="home-link" rel="home">' . __( 'Home', 'jetpack' ) . '</a>';

	$breadcrumb = '';

	if ( $ancestors ) {
		foreach ( $ancestors as $ancestor ) {
			$breadcrumb .= '<a href="' . esc_url( get_permalink( $ancestor ) ) . '">' . esc_html( get_the_title( $ancestor ) ) . '</a>';
		}
	}

	$breadcrumb .= '<span class="current-page">' . esc_html( get_the_title( $post->ID ) ) . '</span>';

	echo $before . $home . $breadcrumb . $after;
}