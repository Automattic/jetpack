<?php
/**
 * Wires up the WooCommerce Analytics front-end tracker for Premium Analytics.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Woocommerce_Analytics;

/**
 * Turns on the modern (ClickHouse + proxy) pipeline and triggers the vendored
 * WooCommerce Analytics tracker, which self-gates on WooCommerce + connection
 * and is idempotent.
 */
class WooCommerce_Analytics_Tracker {

	/**
	 * Register the tracker bootstrap.
	 */
	public static function configure() {
		add_action( 'after_setup_theme', array( __CLASS__, 'bootstrap' ) );
	}

	/**
	 * Enable the modern pipeline and trigger the tracker.
	 *
	 * On `after_setup_theme` the filters are in place before the package reads
	 * them while localizing `window.wcAnalytics` at `wp_footer`.
	 */
	public static function bootstrap() {
		add_filter( 'woocommerce_analytics_clickhouse_enabled', '__return_true' );
		add_filter( 'woocommerce_analytics_experimental_proxy_tracking_enabled', '__return_true' );

		// Guarded because the package ships with the Jetpack plugin or as a
		// composer dependency, not with premium-analytics' own source.
		if ( class_exists( Woocommerce_Analytics::class ) ) {
			Woocommerce_Analytics::init();
		}
	}
}
