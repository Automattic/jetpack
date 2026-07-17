<?php
/**
 * Stubs for WP Super Cache functions and constants used by Boost compatibility code.
 *
 * @package automattic/jetpack-boost
 */

define( 'WPCACHEHOME', '/tmp/wp-super-cache/' );
define( 'WPCACHECONFIGPATH', '/tmp' );

/**
 * Clear the WP Super Cache cache.
 *
 * @param int $blog_id Blog ID.
 */
function wp_cache_clear_cache( $blog_id = 0 ) {}

/**
 * Check if WP Super Cache caching is enabled.
 *
 * @return bool
 */
function wp_cache_is_enabled() {}
