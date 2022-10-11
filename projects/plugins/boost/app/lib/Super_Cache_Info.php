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

	public static function init() {
		if ( ! self::is_super_cache_enabled() ) {
			return;
		}

		add_action( 'rest_api_init', array( static::class, 'register_rest_routes' ) );
		add_filter( 'jetpack_boost_js_constants', array( static::class, 'add_critical_css_constants' ), 10, 1 );
	}

	private static function is_super_cache_enabled() {
		return function_exists( 'wp_cache_is_enabled' ) && wp_cache_is_enabled();
	}

	public static function add_critical_css_constants( $constants ) {
		global $cache_page_secret;

		if ( ! isset( $cache_page_secret ) ) {
			return $constants;
		}

		$constants['superCache'] = array(
			'cachePageSecret' => $cache_page_secret,
		);

		return $constants;
	}

}
