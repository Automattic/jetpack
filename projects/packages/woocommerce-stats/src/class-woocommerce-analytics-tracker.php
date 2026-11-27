<?php
/**
 * Wires up the WooCommerce Analytics front-end tracker for the WooCommerce section.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Woocommerce_Analytics;

/**
 * Turns on ClickHouse and triggers the vendored WooCommerce Analytics tracker where the
 * WooCommerce tab is enabled, unless the host turns store tracking off. Proxy tracking is
 * the host's to turn on. The tracker self-gates on WooCommerce + connection and is idempotent.
 */
class WooCommerce_Analytics_Tracker {

	/**
	 * Filter a host answers to turn store tracking off, as the Jetpack plugin does while its module is off.
	 *
	 * @var string
	 */
	const ENABLED_FILTER = 'jetpack_woocommerce_stats_store_tracking_enabled';

	/**
	 * Register the tracker bootstrap.
	 */
	public static function configure() {
		add_action( 'after_setup_theme', array( __CLASS__, 'bootstrap' ) );
	}

	/**
	 * Turn on ClickHouse and trigger the tracker.
	 *
	 * On `after_setup_theme` the filter is in place before the package reads
	 * it while localizing `window.wcAnalytics` at `wp_footer`.
	 */
	public static function bootstrap() {
		// Kept out of the filter below, so no host can track shoppers on a store whose owner cannot see the data.
		if ( ! Analytics_Dashboard::is_enabled() ) {
			return;
		}

		/**
		 * Filters whether WooCommerce Stats starts WooCommerce Analytics store tracking.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether store tracking is on. Default true.
		 */
		if ( ! apply_filters( self::ENABLED_FILTER, true ) ) {
			return;
		}

		add_filter( 'woocommerce_analytics_clickhouse_enabled', '__return_true' );

		// Guarded because the package ships with the Jetpack plugin or as a
		// composer dependency, not with this package's own source.
		if ( class_exists( Woocommerce_Analytics::class ) ) {
			Woocommerce_Analytics::init();
		}
	}
}
