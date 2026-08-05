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
 * A class rather than a function file so every consumer reaches it through the
 * autoloader: gating lives in files loaded on several different paths, and a
 * `require_once` in each of them is a dependency to keep in sync (and an
 * unmeasurable line of coverage) for no benefit.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * The dashboard's capability rules.
 *
 * @since 0.1.0
 */
class Capabilities {

	/**
	 * Meta capability for reading the dashboard.
	 */
	const VIEW_ANALYTICS = 'jetpack_view_analytics';

	/**
	 * Hooks the dashboard's meta capability mapping.
	 *
	 * Called from WordPress-aware entry points, never at load time: this class is
	 * autoloaded in contexts where WordPress — and add_filter() — isn't there.
	 * Idempotent, so overlapping callers are free to call it.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'map_meta_cap', array( __CLASS__, 'map_meta_caps' ), 10, 3 );
	}

	/**
	 * Unhooks the mapping registered by register().
	 *
	 * Test tear-down needs this to drop the one filter: remove_all_filters(
	 * 'map_meta_cap' ) would also take out Stats' own `view_stats` mapping.
	 *
	 * @return void
	 */
	public static function unregister() {
		remove_filter( 'map_meta_cap', array( __CLASS__, 'map_meta_caps' ), 10 );
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
	 * @param string[] $caps    Primitive capabilities required of the user.
	 * @param string   $cap     Capability being checked.
	 * @param int      $user_id User being checked.
	 * @return string[] Primitives for the dashboard capability; anything else untouched.
	 */
	public static function map_meta_caps( $caps, $cap, $user_id ) {
		if ( self::VIEW_ANALYTICS !== $cap ) {
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
	 * @return bool
	 */
	public static function current_user_can_view_analytics() {
		return current_user_can( self::VIEW_ANALYTICS );
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
	 * @return bool
	 */
	public static function current_user_can_view_store_reports() {
		// The proxy accepts manage_options for every prefix.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_woocommerce_reports' );
	}
}
