<?php
/**
 * Widget availability policy (consumer layer).
 *
 * Premium Analytics' policy over the neutral filters in widget-types.php:
 * availability is the consumer's job, core only offers the hooks.
 *
 * Ships two policies, both hooked on the registry-time filter (a hard hide,
 * which keeps every registry consumer correct without a filtered accessor):
 * developer-only widget types are never registered in production, and the
 * commerce widget categories are only registered while the plugin backing
 * them (WooCommerce, plus WooCommerce Bookings for `bookings`) is active.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Widget categories that are only meaningful with WooCommerce active.
 */
const WOOCOMMERCE_WIDGET_CATEGORIES = array( 'store', 'orders', 'coupons' );

/**
 * Widget categories that are only meaningful with WooCommerce Bookings active.
 *
 * Checked independently of WOOCOMMERCE_WIDGET_CATEGORIES: the Bookings
 * extension cannot run without WooCommerce, so its presence implies both.
 */
const WOOCOMMERCE_BOOKINGS_WIDGET_CATEGORIES = array( 'bookings' );

/**
 * Removes developer-only candidates in production.
 *
 * Split from the hook callback so both branches are testable without touching
 * the global environment.
 *
 * @param array  $widget_candidates Manifest candidates, each with a `name` and `category`.
 * @param string $environment       Site environment type.
 * @return array The candidates, minus developer-only types in production.
 */
function remove_dev_only_widget_types( $widget_candidates, $environment ) {
	if ( 'production' !== $environment ) {
		return $widget_candidates;
	}

	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) {
				return 'developer' !== ( $widget['category'] ?? '' );
			}
		)
	);
}

/**
 * Registry-time callback: hides developer-only types in production.
 *
 * Defaults to `production`; a site opts in via `WP_ENVIRONMENT_TYPE`
 * (`local`, `development`, `staging`).
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array The candidates, minus developer-only types in production.
 */
function filter_registrable_widget_types_by_environment( $widget_candidates ) {
	return remove_dev_only_widget_types( $widget_candidates, wp_get_environment_type() );
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_environment' );

/**
 * Removes candidates whose commerce category lacks its backing plugin.
 *
 * Split from the hook callback so the branches are testable without touching
 * global plugin state.
 *
 * @param array $widget_candidates     Manifest candidates, each with a `category`.
 * @param bool  $woocommerce_available Whether WooCommerce is available.
 * @param bool  $bookings_available    Whether WooCommerce Bookings is available.
 * @return array The candidates, minus commerce categories missing their plugin.
 */
function remove_plugin_gated_widget_types( $widget_candidates, $woocommerce_available, $bookings_available ) {
	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) use ( $woocommerce_available, $bookings_available ) {
				$category = $widget['category'] ?? '';

				if ( ! $woocommerce_available && in_array( $category, WOOCOMMERCE_WIDGET_CATEGORIES, true ) ) {
					return false;
				}

				if ( ! $bookings_available && in_array( $category, WOOCOMMERCE_BOOKINGS_WIDGET_CATEGORIES, true ) ) {
					return false;
				}

				return true;
			}
		)
	);
}

/**
 * Whether the WooCommerce Bookings extension is active.
 *
 * Mirrors the detection in woocommerce-analytics' Bookings sync module;
 * `is_plugin_active()` only exists in admin contexts, hence the guard.
 *
 * @return bool Whether WooCommerce Bookings was detected in the current request.
 */
function is_bookings_plugin_active() {
	return class_exists( 'WC_Bookings' )
		|| ( function_exists( 'is_plugin_active' ) && \is_plugin_active( 'woocommerce-bookings/woocommerce-bookings.php' ) );
}

/**
 * Registry-time callback: hides commerce widget categories without their plugin.
 *
 * WooCommerce availability is read through the store section's signal
 * (dashboard-sections.php, including its availability filter) so section and
 * widgets can't disagree — a consumer overriding the section filter gets
 * matching widget types. Both dashboard entry points load
 * dashboard-sections.php before the widget registry can hydrate, so the
 * function is always defined by the time this callback runs.
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array The candidates, minus commerce categories missing their plugin.
 */
function filter_registrable_widget_types_by_plugin( $widget_candidates ) {
	return remove_plugin_gated_widget_types(
		$widget_candidates,
		is_woocommerce_dashboard_section_available(),
		is_bookings_plugin_active()
	);
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_plugin' );
