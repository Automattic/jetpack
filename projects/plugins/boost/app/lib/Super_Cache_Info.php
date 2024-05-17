<?php
/**
 * Information for Super Cache users
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Super_Cache_Info
 */
class Super_Cache_Info {
	private static function is_super_cache_enabled() {
		return self::is_super_cache_plugin_active() && \wp_cache_is_enabled();
	}

	private static function is_super_cache_plugin_active() {
		return \function_exists( 'wp_cache_is_enabled' );
	}

	public static function get_info() {
		global $cache_page_secret;

		$constants = array(
			'pluginActive' => self::is_super_cache_plugin_active(),
			'cacheEnabled' => self::is_super_cache_enabled(),
		);

		if ( isset( $cache_page_secret ) ) {
			$constants['cachePageSecret'] = $cache_page_secret;
		}

		return $constants;
	}
}
