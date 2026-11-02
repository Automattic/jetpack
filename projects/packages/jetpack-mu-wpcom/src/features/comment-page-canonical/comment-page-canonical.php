<?php
/**
 * Keep the canonical URL on the post when the request didn't ask for a comment page.
 *
 * Core's `comments_template()` fills in `cpage` when comments are paged, and block themes
 * render it before `wp_head`. See https://core.trac.wordpress.org/ticket/58257.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * `get_canonical_url` filter: rebuild the canonical without a `cpage` the request didn't ask for.
 *
 * @param string  $canonical_url The canonical URL.
 * @param WP_Post $post          The post.
 * @return string
 */
function wpcom_comment_page_canonical_url( $canonical_url, $post ) {
	global $wp;

	$cpage = get_query_var( 'cpage' );
	if ( ! $cpage || ! empty( $wp->query_vars['cpage'] ) || get_queried_object_id() !== $post->ID ) {
		return $canonical_url;
	}

	set_query_var( 'cpage', '' );
	$canonical_url = wp_get_canonical_url( $post );
	set_query_var( 'cpage', $cpage );

	return $canonical_url;
}
add_filter( 'get_canonical_url', 'wpcom_comment_page_canonical_url', 10, 2 );
