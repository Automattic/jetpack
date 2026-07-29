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
const VIEW_ANALYTICS_CAPABILITY = 'view_jetpack_analytics';

/**
 * Hooks the dashboard's meta capability mapping.
 *
 * Called at file scope below, not from an init entry point: WPCOM Simple calls
 * Dashboard_Support_Routes::register() standalone, without ever reaching
 * Analytics::init(), and those routes are gated on this capability. Every
 * consumer requires this file, so registering on include is what keeps the two
 * from drifting apart. Idempotent — add_filter() dedupes the same callback.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_capabilities() {
	add_filter( 'map_meta_cap', __NAMESPACE__ . '\\map_analytics_meta_caps', 10, 3 );
}

register_capabilities();

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
 * Whether the current user may read the commerce surfaces.
 *
 * Store data is served by the proxy's `analytics` prefix, which requires
 * `manage_options`; a `view_stats` reader would only get 403s back, so the
 * store section and its widget categories are hidden from them instead.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function current_user_can_view_commerce_analytics() {
	return current_user_can( 'manage_options' );
}
