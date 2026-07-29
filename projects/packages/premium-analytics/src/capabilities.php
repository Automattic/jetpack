<?php
/**
 * Who may see the Premium Analytics dashboard.
 *
 * Jetpack Stats lets a site grant non-administrators access through the
 * `view_stats` meta capability, and this dashboard replaces that UI, so it has
 * to honour the same grant. `add_menu_page()` takes a single capability string,
 * so the "manage_options OR view_stats" rule lives in a meta capability of our
 * own rather than being spelled out at each call site.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Meta capability for reading the dashboard.
 */
const VIEW_ANALYTICS_CAPABILITY = 'jetpack_view_analytics';

/**
 * Hooks the dashboard's meta capability mapping.
 *
 * Deliberately not called at file scope: this file is included while the
 * Analytics class is autoloaded, which happens in contexts where WordPress —
 * and add_filter() — isn't loaded. WordPress-aware entry points call it instead.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_capabilities() {
	add_filter( 'map_meta_cap', __NAMESPACE__ . '\\map_analytics_meta_caps', 10, 3 );
}

/**
 * Unhooks the mapping registered by register_capabilities().
 *
 * Test tear-down needs this to drop the one filter: remove_all_filters(
 * 'map_meta_cap' ) would also take out Stats' own `view_stats` mapping.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function unregister_capabilities() {
	remove_filter( 'map_meta_cap', __NAMESPACE__ . '\\map_analytics_meta_caps', 10 );
}

/**
 * Maps the dashboard capability to the primitives that grant it.
 *
 * `view_stats` alone would track Stats more closely, but it only means
 * anything once the Stats package has hooked its own `map_meta_cap` — which
 * `Analytics::init_wpcom_simple()` never does. Without the `manage_options`
 * arm, an unmapped `view_stats` would take the dashboard away from
 * administrators too, which is worse than the gap this closes.
 *
 * @since $$next-version$$
 *
 * @param string[] $caps    Primitive capabilities required of the user.
 * @param string   $cap     Capability being checked.
 * @param int      $user_id User being checked.
 * @return string[] Primitives for the dashboard capability; anything else untouched.
 */
function map_analytics_meta_caps( $caps, $cap, $user_id ) {
	if ( VIEW_ANALYTICS_CAPABILITY !== $cap ) {
		return $caps;
	}

	if ( user_can( $user_id, 'manage_options' ) || user_can( $user_id, 'view_stats' ) ) {
		return array( 'read' );
	}

	return array( 'do_not_allow' );
}

/**
 * Whether the current user may read the dashboard.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function current_user_can_view_analytics() {
	return current_user_can( VIEW_ANALYTICS_CAPABILITY );
}

/**
 * Whether the current user may read the store reports.
 *
 * "Store reports" is everything the proxy serves from its `analytics` prefix —
 * WooCommerce's own reporting data. Mirrors the capability
 * {@see \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller} enforces
 * there (Capabilities_Test pins the two together); surfaces backed by the prefix
 * are hidden from readers who fail it, since all they could collect is 403s.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function current_user_can_view_store_reports() {
	// The proxy accepts manage_options for every prefix.
	return current_user_can( 'manage_options' ) || current_user_can( 'view_woocommerce_reports' );
}
