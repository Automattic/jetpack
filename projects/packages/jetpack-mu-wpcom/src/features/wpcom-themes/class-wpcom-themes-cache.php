<?php
/**
 * Class WPCom_Themes_Cache.
 * Caches WPCom themes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Basic cache implementation for themes.
 */
class WPCom_Themes_Cache {
	/**
	 * The cache group.
	 *
	 * @var string
	 */
	const CACHE_GROUP = 'wpcom-themes-cache';

	/**
	 * Executes the supplied callable and caches the result.
	 *
	 * @param string   $cache_key The cache key.
	 * @param callable $lambda    Callable that returns theme data.
	 * @param int      $ttl       Time to live in seconds.
	 *
	 * @return mixed Cached data.
	 */
	public function run_cached( string $cache_key, callable $lambda, int $ttl = DAY_IN_SECONDS ) {
		$data = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false !== $data && ! defined( 'IGNORE_CACHED_WPCOM_THEMES' ) ) {
			return $data;
		}

		$data = $lambda();

		// Null means the read failed rather than came back empty, and a failure is not cached: a
		// moment's trouble reaching WordPress.com would otherwise empty the theme lists for a day.
		if ( null !== $data ) {
			wp_cache_set( $cache_key, $data, self::CACHE_GROUP, $ttl );
		}

		return $data;
	}
}
