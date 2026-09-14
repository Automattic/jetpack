<?php
/**
 * Stand-in for the multisite `get_blog_post()`, which WorDBless doesn't load.
 *
 * @package automattic/jetpack-newsletter
 */

if ( ! function_exists( 'get_blog_post' ) ) {
	/**
	 * Look a post up in the registry, keyed as `<blog_id>:<post_id>`.
	 *
	 * @param int $blog_id The blog ID.
	 * @param int $post_id The post ID.
	 * @return object|null
	 */
	function get_blog_post( $blog_id, $post_id ) {
		return $GLOBALS['jetpack_newsletter_wpcom_doubles']['blog_posts'][ "$blog_id:$post_id" ] ?? null;
	}
}
