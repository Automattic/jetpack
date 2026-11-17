<?php
/**
 * The site's choice of report provider.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;
use Automattic\WooCommerce\Admin\API\Reports\Cache as Reports_Cache;

/**
 * Which providers a `provider=auto` request may use: `wpcom`, `local`, or `both` (local first).
 *
 * @internal Not a stable contract yet: the values may change before a settings UI exists.
 *
 * @since $$next-version$$
 */
class Provider_Setting {

	/**
	 * Option holding the site's setting. Not autoloaded: only report requests read it.
	 */
	const OPTION = 'jetpack_woocommerce_stats_report_provider';

	/**
	 * Filter overriding the option.
	 */
	const FILTER = 'jetpack_woocommerce_stats_report_provider';

	/**
	 * Providers to try for each setting, in order.
	 */
	private const CANDIDATES = array(
		'wpcom' => array( 'wpcom' ),
		'local' => array( 'local' ),
		'both'  => array( 'local', 'wpcom' ),
	);

	/**
	 * Setting of a site that has none, or an unknown one.
	 */
	private const DEFAULT_SETTING = 'wpcom';

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
		add_action( 'add_option_' . self::OPTION, array( __CLASS__, 'clear_report_caches' ) );
		add_action( 'update_option_' . self::OPTION, array( __CLASS__, 'clear_report_caches' ) );
		foreach ( self::REPORT_OPTIONS as $option ) {
			add_action( 'add_option_' . $option, array( __CLASS__, 'maybe_clear_report_caches' ) );
			add_action( 'update_option_' . $option, array( __CLASS__, 'maybe_clear_report_caches' ) );
		}
	}

	/**
	 * The site's setting.
	 *
	 * @return string `wpcom`, `local` or `both`.
	 */
	public static function get() {
		/**
		 * Filters which providers a store report requested with `provider=auto` may use. Experimental:
		 * the values may change before a settings UI exists.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $setting `wpcom`, `local`, or `both` for local where it serves the whole request and WordPress.com otherwise.
		 */
		$setting = apply_filters( self::FILTER, get_option( self::OPTION, self::DEFAULT_SETTING ) );

		return is_string( $setting ) && isset( self::CANDIDATES[ $setting ] ) ? $setting : self::DEFAULT_SETTING;
	}

	/**
	 * Providers to try, in order, for a `provider=auto` request.
	 *
	 * @return string[]
	 */
	public static function get_candidates() {
		return self::CANDIDATES[ self::get() ];
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
	 * Drop cached reports after a report option changes, on a site that serves reports locally.
	 *
	 * @return void
	 */
	public static function maybe_clear_report_caches() {
		if ( in_array( 'local', self::get_candidates(), true ) ) {
			self::clear_report_caches();
		}
	}
}
