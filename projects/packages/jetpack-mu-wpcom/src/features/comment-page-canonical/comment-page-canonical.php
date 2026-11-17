<?php
/**
 * Keep the canonical URL on the post when the request didn't ask for a comment page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * `comments_template()` fills in `cpage` when the URL has none, and block templates run it
 * before `wp_head` (legacy Comments block, WooCommerce reviews). See https://core.trac.wordpress.org/ticket/11856.
 *
 * @param string  $canonical_url The canonical URL.
 * @param WP_Post $post          The post.
 * @return string
 */
function wpcom_comment_page_canonical_url( $canonical_url, $post ) {
	global $wp;

	if ( ! get_query_var( 'cpage' ) || ! empty( $wp->query_vars['cpage'] ) || get_queried_object_id() !== $post->ID ) {
		return $canonical_url;
	}

	$canonical_url = get_permalink( $post );
	$page          = (int) get_query_var( 'page', 0 );
	if ( $page >= 2 ) {
		$canonical_url = get_option( 'permalink_structure' )
			? trailingslashit( $canonical_url ) . user_trailingslashit( $page, 'single_paged' )
			: add_query_arg( 'page', $page, $canonical_url );
	}

	return $canonical_url;
}
add_filter( 'get_canonical_url', 'wpcom_comment_page_canonical_url', 1, 2 );
