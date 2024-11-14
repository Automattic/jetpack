<?php
/**
 * Class WPCom_Themes_Cache.
 * Caches WPCom themes.
 *
 * @package wpcom-themes
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

		if ( false === $data || defined( 'IGNORE_CACHED_WPCOM_THEMES' ) ) {
			$data = $lambda();
			wp_cache_set( $cache_key, $data, self::CACHE_GROUP, $ttl );
		}

		return $data;
	}
}
