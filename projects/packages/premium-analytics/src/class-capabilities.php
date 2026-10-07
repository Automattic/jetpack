<?php
/**
 * Who may see the Premium Analytics dashboard.
 *
 * Jetpack Stats grants non-administrators access via the `view_stats` meta capability, and
 * WooCommerce grants store reports via `view_woocommerce_reports`; this dashboard must honour
 * both grants, and add_menu_page() takes one capability string — hence a meta capability of our own.
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
	 * Called from WordPress-aware entry points, never at load time: this class is autoloaded where
	 * WordPress — and add_filter() — isn't there. Idempotent, so overlapping callers may call it freely.
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
	 * A reader needs at least one section they can read: Stats, or the store reports where the
	 * site shows the WooCommerce section at all.
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

		if ( self::user_can_view_stats( $user_id ) || ( self::user_can_view_store_reports( $user_id ) && self::is_store_section_enabled_on_site() ) ) {
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
	 * Whether the current user may read the Stats reports.
	 *
	 * "Stats reports" is everything the proxy serves under `view_stats`, mirroring what
	 * {@see \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller} enforces there (pinned by Capabilities_Test).
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function current_user_can_view_stats() {
		return self::user_can_view_stats( get_current_user_id() );
	}

	/**
	 * Whether the current user may read the store reports.
	 *
	 * "Store reports" is everything the proxy serves from its `analytics` prefix, mirroring what
	 * {@see \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller} enforces there (pinned by Capabilities_Test).
	 *
	 * @return bool
	 */
	public static function current_user_can_view_store_reports() {
		return self::user_can_view_store_reports( get_current_user_id() );
	}

	/**
	 * Whether a user may read the Stats reports.
	 *
	 * `view_stats` alone would track Stats more closely, but it only works once Stats hooks its
	 * own `map_meta_cap` — which Analytics::init_wpcom_simple() never does, locking out administrators too.
	 *
	 * @param int $user_id User being checked.
	 * @return bool
	 */
	private static function user_can_view_stats( $user_id ) {
		return user_can( $user_id, 'manage_options' ) || user_can( $user_id, 'view_stats' );
	}

	/**
	 * Whether a user may read the store reports.
	 *
	 * @param int $user_id User being checked.
	 * @return bool
	 */
	private static function user_can_view_store_reports( $user_id ) {
		// The proxy accepts manage_options for every prefix.
		return user_can( $user_id, 'manage_options' ) || user_can( $user_id, 'view_woocommerce_reports' );
	}

	/**
	 * Whether the site shows the WooCommerce section to readers who may see it.
	 *
	 * False until the section rules load: both entry points load them before the menu and the
	 * REST routes check the capability.
	 *
	 * @return bool
	 */
	private static function is_store_section_enabled_on_site() {
		return function_exists( __NAMESPACE__ . '\\is_store_dashboard_section_enabled_on_site' )
			&& is_store_dashboard_section_enabled_on_site();
	}

	/**
	 * Whether the current user may view ad reports.
	 *
	 * @since 0.4.0
	 *
	 * @return bool
	 */
	public static function current_user_can_view_ad_reports() {
		return current_user_can( 'manage_options' );
	}
}
