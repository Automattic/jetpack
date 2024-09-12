<?php
/**
 * Another helper class for parsing Jetpack Search options.
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;

/**
 * Helpers for parsing the various Search options
 */
class Options {
	/**
	 * The search widget's base ID.
	 *
	 * @since 5.8.0
	 * @var string
	 */
	const FILTER_WIDGET_BASE = 'jetpack-search-filters';

	/**
	 * Prefix for options in DB.
	 *
	 * @since 8.3.0
	 * @var string
	 */
	const OPTION_PREFIX = 'jetpack_search_';

	/**
	 * Available result formats.
	 *
	 * @since 9.6.0
	 * @var string
	 */
	const RESULT_FORMAT_MINIMAL  = 'minimal';
	const RESULT_FORMAT_EXPANDED = 'expanded';
	const RESULT_FORMAT_PRODUCT  = 'product';

	/**
	 * Available overlay triggers.
	 *
	 * @since 9.9.0
	 * @var string
	 */
	const OVERLAY_TRIGGER_IMMEDIATE = 'immediate';
	const OVERLAY_TRIGGER_SUBMIT    = 'submit';
	const DEFAULT_OVERLAY_TRIGGER   = self::OVERLAY_TRIGGER_SUBMIT;

	/**
	 * Deprecated overlay trigger.
	 *
	 * @var string
	 * @deprecated since 11.3
	 */
	const OVERLAY_TRIGGER_RESULTS = 'results';

	/**
	 * Returns a boolean for whether instant search is enabled.
	 *
	 * @since 8.3.0
	 *
	 * @return bool
	 */
	public static function is_instant_enabled() {
		return true === (bool) get_option( 'instant_search_enabled' );
	}

	/**
	 * Returns a boolean for whether the current site has a VIP index.
	 *
	 * @since 5.8.0
	 *
	 * @return bool
	 */
	public static function site_has_vip_index() {
		$has_vip_index = (
			Constants::is_defined( 'JETPACK_SEARCH_VIP_INDEX' ) &&
			Constants::get_constant( 'JETPACK_SEARCH_VIP_INDEX' )
		);

		/**
		 * Allows developers to filter whether the current site has a VIP index.
		 *
		 * @module search
		 *
		 * @since  5.8.0
		 *
		 * @param bool $has_vip_index Whether the current site has a VIP index.
		 */
		return apply_filters( 'jetpack_search_has_vip_index', $has_vip_index );
	}

	/**
	 * Returns the cache key for an option if persisted with get_cached_option method below.
	 *
	 * @param string $option_name - The name of the option to get the cache key for.
	 *
	 * @return bool
	 */
	public static function get_cached_option_key( $option_name ) {
		return Package::VERSION . '-' . $option_name;
	}

	/**
	 * Checks the cache for the option. If it doesn't exist, fetch from DB and persist in the cache.
	 * Designed to be used for "pre_option_${option_name}" filters.
	 *
	 * @param string $option_name - The name of the option to get.
	 * @param mixed  $default_value - The fallback value if the option does not exist.
	 * @param int    $cache_timeout - The number of seconds to cache the option for.
	 *
	 * @return bool
	 */
	public static function get_cached_option( $option_name, $default_value = false, $cache_timeout = 3600 ) {
		$cache_key = self::get_cached_option_key( $option_name );
		$value     = wp_cache_get( $cache_key, 'jetpack-search' );
		if ( false === $value ) {
			$value = get_option( $option_name, $default_value );
			wp_cache_set( $cache_key, $value, 'jetpack-search', $cache_timeout );
		}
		return $value;
	}

	/**
	 * Updates the cache for the option.
	 * Designed to be used for "updated_option" actions.
	 *
	 * @param string $option_name - The name of the option to update.
	 * @param mixed  $value - The value to update the option to.
	 * @param int    $cache_timeout - The number of seconds to cache the option for.
	 *
	 * @return bool
	 */
	public static function update_cached_option( $option_name, $value, $cache_timeout = 3600 ) {
		$option_key = self::get_cached_option_key( $option_name );
		wp_cache_set( $option_key, $value, 'jetpack-search', $cache_timeout );
		return true;
	}
}
