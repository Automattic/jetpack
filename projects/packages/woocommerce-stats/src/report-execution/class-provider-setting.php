<?php
/**
 * The site's choice of report providers.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;
use Automattic\WooCommerce\Admin\API\Reports\Cache as Reports_Cache;

/**
 * The registered providers a `provider=auto` request may use, in order of preference.
 *
 * @internal Not a stable contract yet: the format may change before a settings UI exists.
 *
 * @since $$next-version$$
 */
class Provider_Setting {

	/**
	 * Option holding the provider names, as a list or comma-separated. Write it with autoload off: only report requests read it.
	 */
	const OPTION = 'jetpack_woocommerce_stats_report_providers';

	/**
	 * Filter overriding the option.
	 */
	const FILTER = 'jetpack_woocommerce_stats_report_providers';

	/**
	 * Options that change what a report counts or how it groups weeks, but not core's report cache key.
	 */
	private const REPORT_OPTIONS = array( 'start_of_week', 'woocommerce_excluded_report_order_statuses' );

	/**
	 * Hook the cache clearing.
	 *
	 * @return void
	 */
	public static function init() {
		foreach ( array( 'add_option_', 'update_option_', 'delete_option_' ) as $hook ) {
			add_action( $hook . self::OPTION, array( __CLASS__, 'clear_report_caches' ) );
			foreach ( self::REPORT_OPTIONS as $option ) {
				add_action( $hook . $option, array( __CLASS__, 'maybe_clear_report_caches' ) );
			}
		}
	}

	/**
	 * Provider names to try, in order, for a `provider=auto` request; none when the site has no setting.
	 *
	 * @return string[]
	 */
	public static function get_providers() {
		/**
		 * Filters the providers a store report requested with `provider=auto` may use, in order of
		 * preference. Experimental: the format may change before a settings UI exists.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[]|string $providers Registered provider names, such as `wpcom` or `local`, as a list or comma-separated.
		 */
		$providers = apply_filters( self::FILTER, get_option( self::OPTION, array() ) );
		if ( ! is_array( $providers ) && ! is_string( $providers ) ) {
			return array();
		}

		return array_values( array_unique( array_filter( wp_parse_list( $providers ), 'is_string' ) ) );
	}

	/**
	 * Drop both providers' cached reports, so a source switch doesn't compare a stale answer with a fresh one.
	 *
	 * @return void
	 */
	public static function clear_report_caches() {
		Api_Proxy_Controller::clear_cache();
		if ( class_exists( Reports_Cache::class ) ) {
			Reports_Cache::invalidate();
		}
	}

	/**
	 * Drop cached reports after a report option changes, on a site with a provider setting.
	 *
	 * @return void
	 */
	public static function maybe_clear_report_caches() {
		if ( self::get_providers() ) {
			self::clear_report_caches();
		}
	}
}
