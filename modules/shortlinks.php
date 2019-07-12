<?php
/**
 * Module Name: WP.me Shortlinks
 * Module Description: Generates shorter links so you can have more space to write on social media sites.
 * Sort Order: 8
 * First Introduced: 1.1
 * Requires Connection: Yes
 * Auto Activate: No
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
	return wpme_get_shortlink( $id, $context, $allow_slugs );
}

/**
 * Add Shortlinks to the REST API responses.
 *
 * @since 6.9.0
 *
 * @action rest_api_init
 * @uses register_rest_field, wpme_rest_get_shortlink
 */
function wpme_rest_register_shortlinks() {
	register_rest_field(
		array(
			'attachment',
			'page',
			'post',
		),
		'jetpack_shortlink',
		array(
			'get_callback'    => 'wpme_rest_get_shortlink',
			'update_callback' => null,
			'schema'          => null,
		)
	);
}

/**
 * Get the shortlink of a post.
 *
 * @since 6.9.0
 *
 * @param array $object Details of current post.
 *
 * @uses wpme_get_shortlink
 *
 * @return string
 */
function wpme_rest_get_shortlink( $object ) {
	return wpme_get_shortlink( $object['id'], array() );
}

// Add shortlinks to the REST API Post response.
add_action( 'rest_api_init', 'wpme_rest_register_shortlinks' );

/**
 * Set the Shortlink Gutenberg extension as available.
 */
function wpme_set_extension_available() {
	Jetpack_Gutenberg::set_extension_available( 'jetpack/shortlinks' );
}

add_action( 'init', 'wpme_set_extension_available' );
