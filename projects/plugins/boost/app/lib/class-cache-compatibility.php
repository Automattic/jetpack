<?php
/**
 * Compatibility class for caching plugins.
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Compatibility class for caching plugins.
 */
class Cache_Compatibility {
	/**
	 * Checks if the site has a caching plugin.
	 *
	 * Supports:
	 * - Endurance Page Cache
	 *
	 * @since 4.0.0
	 *
	 * @return bool True if the site has a caching plugin, false otherwise.
	 */
	public static function has_cache() {
		/**
		 * Filters whether the site has a caching plugin.
		 * Useful for testing.
		 *
		 * @since 4.0.0
		 *
		 * @param bool $has_cache True if the site has a caching plugin, false otherwise.
		 */
		$has_cache = apply_filters( 'jetpack_boost_compatibility_has_cache', false );
		if ( $has_cache ) {
			return true;
		}

		/*
		 * Disable Page Cache on sites that run Newfold's caching service.
		 * Their cache is considered enabled when the endurance_cache_level option is set to 2 or 3.
		 *
		 * @link https://github.com/bluehost/endurance-page-cache/blob/59fe9993d2cb8a03d1df6da8325f73ad0851ba0a/endurance-page-cache.php#L343
		 */
		if (
			class_exists( '\\Endurance_Page_Cache' )
			&& 2 <= (int) get_option( 'endurance_cache_level' )
		) {
			return true;
		}

		return false;
	}
}
