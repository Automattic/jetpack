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

	$before = '<nav class="entry-breadcrumbs" itemscope itemtype="http://schema.org/BreadcrumbList">';
	$after = '</nav>';

	$home = '<span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem"><a href="' . esc_url( home_url( "/" ) ) . '" class="home-link" itemprop="item" rel="home"><span itemprop="name">' . __( 'Home', 'jetpack' ) . '</span></a></span>';

	$breadcrumb = '';

	if ( $ancestors ) {
		foreach ( $ancestors as $ancestor ) {
			$breadcrumb .= '<span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem"><a href="' . esc_url( get_permalink( $ancestor ) ) . '" itemprop="item"><span itemprop="name">' . esc_html( get_the_title( $ancestor ) ) . '</span></a></span>';
		}
	}

	$breadcrumb .= '<span class="current-page" itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem"><span itemprop="name">' . esc_html( get_the_title( $post->ID ) ) . '</span></span>';

	echo $before . $home . $breadcrumb . $after;
}
