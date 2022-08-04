<?php
/**
 * Manages the Jetpack blocks configuration for Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Hook for the `jetpack_podcast_feed_cache_timeout` filter to specify a reduced feed cache timeout
 * when we're fetching RSS feeds for Jetpack blocks.
 *
 * @param int|null $cache_timeout The default podcast feed cache timeout, which defaults to null.
 * @return int The reduced timeout.
 */
function wpcomsh_jetpack_podcast_set_cache_timeout( $cache_timeout ): int {
	return HOUR_IN_SECONDS;
}

add_filter( 'jetpack_podcast_feed_cache_timeout', 'wpcomsh_jetpack_podcast_set_cache_timeout' );
