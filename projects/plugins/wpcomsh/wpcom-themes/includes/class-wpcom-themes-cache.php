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
	 * The cache key.
	 *
	 * @var string
	 */
	const CACHE_KEY = 'wpcom-themes-list';

	/**
	 * Executes the callable responsible for obtaining a WPCom theme list and caches the result.
	 *
	 * @param callable $lambda Callable that returns a theme list.
	 * @param int      $ttl    Time to live in seconds.
	 *
	 * @return array Array of cached themes.
	 */
	public function run_cached( callable $lambda, int $ttl = DAY_IN_SECONDS ): mixed {
		$data = wp_cache_get( self::CACHE_KEY, self::CACHE_GROUP );

		if ( false === $data ) {
			$data = $lambda();
			wp_cache_set( self::CACHE_KEY, $data, self::CACHE_GROUP, $ttl );
		}

		return $data;
	}
}
