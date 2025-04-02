<?php
/**
 * This file contains all the public actions for the Page Cache module.
 * This file is loaded before WordPress is fully initialized.
 */

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;

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
	$boost_cache->invalidate_cache( Filesystem_Utils::DELETE_ALL );
}

/**
 * Delete cache for homepage and paged archives.
 */
function jetpack_boost_delete_cache_for_home() {
	$boost_cache = new Boost_Cache();
	$boost_cache->invalidate_cache_for_front_page( Filesystem_Utils::DELETE_ALL );
}

/**
 * Delete cache for a specific URL.
 *
 * @param string $url - The URL to delete the cache for.
 */
function jetpack_boost_delete_cache_for_url( $url ) {
	$boost_cache = new Boost_Cache();
	$boost_cache->invalidate_cache_for_url( $url, Filesystem_Utils::DELETE_ALL );
}

/**
 * Delete cache for a specific post.
 *
 * @param int $post_id - The ID of the post to delete the cache for.
 */
function jetpack_boost_delete_cache_by_post_id( $post_id ) {
	$boost_cache = new Boost_Cache();
	$boost_cache->invalidate_cache_by_post_id( (int) $post_id, Filesystem_Utils::DELETE_ALL );
}
