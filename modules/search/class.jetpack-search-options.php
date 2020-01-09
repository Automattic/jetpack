<?php
/**
 * Jetpack Search: Jetpack_Search_Options class
 *
 * @package    Jetpack
 * @subpackage Jetpack Search
 * @since      8.3.0
 */

use Automattic\Jetpack\Constants;

/**
 * Helpers for parsing the various Search options
 *
 * @since 8.3.0
 */
class Jetpack_Search_Options {

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
	 * Returns a boolean for whether instant search is enabled.
	 *
	 * @since 8.3.0
	 *
	 * @return bool
	 */
	public static function is_instant_enabled() {
		return Constants::is_true( 'JETPACK_SEARCH_PROTOTYPE' );
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


}
