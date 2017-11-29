<?php
/**
 * Module Name: WP.me Shortlinks
 * Module Description: Create short and simple links for all posts and pages.
 * Sort Order: 8
 * First Introduced: 1.1
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Social
 * Feature: Writing
 * Additional Search Queries: shortlinks, wp.me
 */

add_filter( 'pre_get_shortlink', 'wpme_get_shortlink_handler', 1, 4 );

if ( !function_exists( 'wpme_dec2sixtwo' ) ) {
	function wpme_dec2sixtwo( $num ) {
		$index = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$out = "";

		if ( $num < 0 ) {
			$out = '-';
			$num = abs( $num );
		}

		for ( $t = floor( log10( $num ) / log10( 62 ) ); $t >= 0; $t-- ) {
			$a = floor( $num / pow( 62, $t ) );
			$out = $out . substr( $index, $a, 1 );
			$num = $num - ( $a * pow( 62, $t ) );
		}

		return $out;
	}
}

function wpme_get_shortlink( $id = 0, $context = 'post', $allow_slugs = true ) {
	global $wp_query;

	$blog_id = Jetpack_Options::get_option( 'id' );

	if ( 'query' == $context ) {
		if ( is_singular() ) {
			$id = $wp_query->get_queried_object_id();
			$context = 'post';
		} elseif ( is_front_page() ) {
			$context = 'blog';
		} else {
			return '';
		}
	}

	if ( 'blog' == $context ) {
		if ( empty( $id ) )
			$id = $blog_id;

		return 'https://wp.me/' . wpme_dec2sixtwo( $id );
	}

	$post = get_post( $id );

	if ( empty( $post ) )
			return '';

	$post_id = $post->ID;
	$type = '';

	if ( $allow_slugs && 'publish' == $post->post_status && 'post' == $post->post_type && strlen( $post->post_name ) <= 8 && false === strpos( $post->post_name, '%' )
		&& false === strpos( $post->post_name, '-' ) ) {
		$id = $post->post_name;
		$type = 's';
	} else {
		$id = wpme_dec2sixtwo( $post_id );
		if ( 'page' == $post->post_type )
			$type = 'P';
		elseif ( 'post' == $post->post_type || post_type_supports( $post->post_type, 'shortlinks' ) )
			$type= 'p';
		elseif ( 'attachment' == $post->post_type )
			$type = 'a';
	}

	if ( empty( $type ) )
		return '';

	return 'https://wp.me/' . $type . wpme_dec2sixtwo( $blog_id ) . '-' . $id;
}

function wpme_get_shortlink_handler( $shortlink, $id, $context, $allow_slugs ) {
	if ( $shortlink === false ) {	// respect / do not change the value from previous filter hooks
		$shortlink = wpme_get_shortlink( $id, $context, $allow_slugs );	// returns wp.me shortlink or empty string
		if ( $shortlink === '' ) {	// empty string for empty post object or no post type support for shortlinks
			$shortlink = false;	// allow wp_get_shortlink() to continue and return its own shortlink
		}
	}
	return $shortlink;	// return false, previous shortlink, or wp.me shortlink (if no previous shortlink)
}
