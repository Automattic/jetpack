<?php

if ( ! function_exists( 'wp_cache_flush_runtime' ) ) {
	/**
	 * Removes all cache items from the in-memory runtime cache.
	 *
	 * @return bool True on success, false on failure.
	 */
	function wp_cache_flush_runtime() {
		return wp_cache_flush();
	}
}
