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
 * Maps a wp.me shortlink of the current site to the post ID it encodes.
 *
 * @param int    $post_id The post ID resolved by core.
 * @param string $url     The requested URL.
 * @return int The post ID.
 */
function wpcom_wpme_oembed_request_post_id( $post_id, $url ) {
	if ( $post_id || ! preg_match( '#^https?://wp\.me/[pPa]([0-9a-zA-Z]+)-([0-9a-zA-Z]+)$#', (string) $url, $matches ) ) {
		return $post_id;
	}

	$base62_decode = static function ( $str ) {
		$num = 0;
		foreach ( str_split( $str ) as $char ) {
			$num = $num * 62 + strpos( '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', $char );
		}
		return $num;
	};

	return $base62_decode( $matches[1] ) === get_wpcom_blog_id() ? $base62_decode( $matches[2] ) : $post_id;
}
add_filter( 'oembed_request_post_id', 'wpcom_wpme_oembed_request_post_id', 10, 2 );
