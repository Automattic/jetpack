<?php
/**
 * This file contains all the public actions for the Page Cache module.
 * This file is loaded before WordPress is fully initialized.
 */

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

/**
 * Delete all cache.
 *
 * Allow third-party plugins to clear all cache.
 */
add_action( 'jetpack_boost_clear_page_cache_all', 'jetpack_boost_delete_cache' );

/**
 * Delete cache for homepage and paged archives.
 *
 * Allow third-party plugins to clear front-page cache.
 */
add_action( 'jetpack_boost_clear_page_cache_home', 'jetpack_boost_delete_cache_for_home' );

/**
 * Delete cache for a specific URL.
 *
 * Allow third-party plugins to clear the cache for a specific URL.
 *
 * @param string $url - The URL to delete the cache for.
 */
add_action( 'jetpack_boost_clear_page_cache_url', 'jetpack_boost_delete_cache_for_url' );

/**
 * Delete cache for a specific post.
 *
 * Allow third-party plugins to clear the cache for a specific post.
 *
 * @param int $post_id - The ID of the post to delete the cache for.
 */
add_action( 'jetpack_boost_clear_page_cache_post', 'jetpack_boost_delete_cache_by_post_id' );

/**
 * Delete all cache files.
 */
function jetpack_boost_delete_cache() {
	$boost_cache = new Boost_Cache();
	$boost_cache->delete_recursive( home_url() );
}

/**
 * Delete cache for homepage and paged archives.
 */
function jetpack_boost_delete_cache_for_home() {
	$boost_cache = new Boost_Cache();
	$boost_cache->delete_page( home_url() );
}

/**
 * Delete cache for a specific URL.
 *
 * @param string $url - The URL to delete the cache for.
 */
function jetpack_boost_delete_cache_for_url( $url ) {
	$boost_cache = new Boost_Cache();
	$boost_cache->delete_page( $url );
}

/**
 * Delete cache for a specific post.
 *
 * @param int $post_id - The ID of the post to delete the cache for.
 */
function jetpack_boost_delete_cache_by_post_id( $post_id ) {
	$post = get_post( (int) $post_id );
	if ( ! $post ) {
		return;
	}
	static $already_deleted = -1;
	if ( $already_deleted === $post->ID ) {
		return;
	}

	/**
	 * Don't invalidate the cache for post types that are not public.
	 */
	if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
		return;
	}

	$already_deleted = $post->ID;

	/**
	 * If a post is unpublished, the permalink will be deleted. In that case,
	 * get_sample_permalink() will return a permalink with ?p=123 instead of
	 * the post name. We need to get the post name from the post object.
	 */
	$permalink = get_permalink( $post->ID );
	Logger::debug( "invalidate_cache_for_post: $permalink" );

	$boost_cache = new Boost_Cache();
	$boost_cache->delete_page( $permalink );
}
