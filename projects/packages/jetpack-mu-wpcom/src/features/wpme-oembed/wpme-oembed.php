<?php
/**
 * Lets the site's oEmbed endpoint resolve its own wp.me shortlinks.
 *
 * Embedding a wp.me shortlink goes through oEmbed discovery, which asks the
 * site's endpoint about the wp.me URL itself. Core can't map it to a post.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Decodes a base62 string, as used by wp.me shortlinks.
 *
 * @param string $str Base62 string.
 * @return int The decoded number.
 */
function wpcom_wpme_base62_decode( $str ) {
	$num = 0;
	foreach ( str_split( $str ) as $char ) {
		$num = $num * 62 + strpos( '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', $char );
	}
	return $num;
}

/**
 * Maps a wp.me shortlink of the current site to the post it points to.
 *
 * @param int    $post_id The post ID resolved by core.
 * @param string $url     The requested URL.
 * @return int The post ID.
 */
function wpcom_wpme_oembed_request_post_id( $post_id, $url ) {
	// Capped at 10 characters so the decoded IDs fit in an int.
	if ( $post_id || ! preg_match( '#^https?://wp\.me/([pPas])([0-9a-zA-Z]{1,10})-([0-9a-zA-Z]{1,10})$#', (string) $url, $matches ) ) {
		return $post_id;
	}

	if ( wpcom_wpme_base62_decode( $matches[2] ) !== get_wpcom_blog_id() ) {
		return $post_id;
	}

	if ( 's' === $matches[1] ) {
		$post = get_page_by_path( $matches[3], OBJECT, 'post' );
		return $post ? $post->ID : $post_id;
	}

	return wpcom_wpme_base62_decode( $matches[3] );
}
add_filter( 'oembed_request_post_id', 'wpcom_wpme_oembed_request_post_id', 10, 2 );
