<?php
/**
 * Widget availability policy (consumer layer): hides developer-only, Simple-only, and
 * plugin-gated widget types at registry time — a hard hide, so every consumer of the
 * registry sees the same set, over the neutral hooks in widget-types.php.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/widget-types.php';
require_once __DIR__ . '/widget-type-support.php';

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
 * Widget categories whose data counts as a store report — by data source, not subject
 * matter: each reaches WPCOM via the proxy's `analytics` prefix (gated on
 * `view_woocommerce_reports`), including `visitors`, which reads `sessions/…` from it.
 */
const STORE_REPORT_WIDGET_CATEGORIES = array( 'store', 'orders', 'coupons', 'bookings', 'visitors' );

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
 * Applies shared type-level availability at registry time.
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array Filtered candidates.
 */
function filter_registrable_widget_types_by_availability( $widget_candidates ) {
	return remove_unsupported_widget_items(
		$widget_candidates,
		'name',
		get_widget_support_context()
	);
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_availability' );

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
 * Registry-time callback: hides commerce categories without their plugin, reading
 * WooCommerce availability through the store section's signal so section and widgets
 * agree; both entry points load dashboard-sections.php before the registry hydrates.
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

// Subscriber widgets stay registered even when their section is hidden: their data
// doesn't depend on the local module, and unregistering would break instances placed elsewhere.

/**
 * Removes candidates the reader could not load data for anyway.
 *
 * Split from the hook callback so both branches are testable without a user.
 *
 * @since 0.1.0
 *
 * @param array $widget_candidates      Manifest candidates, each with a `category`.
 * @param bool  $can_view_store_reports Whether the reader may see the store reports.
 * @return array The candidates, minus the store-report categories for readers who can't.
 */
function remove_capability_gated_widget_types( $widget_candidates, $can_view_store_reports ) {
	if ( $can_view_store_reports ) {
		return $widget_candidates;
	}

	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) {
				return ! in_array( $widget['category'] ?? '', STORE_REPORT_WIDGET_CATEGORIES, true );
			}
		)
	);
}

/**
 * Registry-time callback: hides widgets whose data the reader cannot fetch — a
 * `view_stats` reader would only collect 403s from the proxy's `analytics` prefix.
 * The registry is request-scoped, so filtering on the current user is safe here.
 *
 * @since 0.1.0
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array The candidates, minus the store-report categories for readers who can't see them.
 */
function filter_registrable_widget_types_by_capability( $widget_candidates ) {
	return remove_capability_gated_widget_types(
		$widget_candidates,
		Capabilities::current_user_can_view_store_reports()
	);
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_capability' );
