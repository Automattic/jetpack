<?php
/**
 * Who may see the Premium Analytics dashboard.
 *
 * Opening it takes one section available to the reader, by whatever rule that section registered,
 * and add_menu_page() takes one capability string — hence a meta capability of our own.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

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
		self::$has_available_section = array();
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
		self::$has_available_section = array();
		remove_filter( 'map_meta_cap', array( __CLASS__, 'map_meta_caps' ), 10 );
	}

	/**
	 * Whether a section's availability check is running, so a section gated on the dashboard
	 * capability itself does not recurse.
	 *
	 * @var bool
	 */
	private static $resolving_sections = false;

	/**
	 * Whether a section is available, per `<user id>:<blog id>`, for the rest of the request.
	 *
	 * @var array<string, bool>
	 */
	private static $has_available_section = array();

	/**
	 * Maps the dashboard capability: a reader needs at least one section available to them.
	 *
	 * Sections answer for the current user only, so checking anyone else is refused.
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

		if ( (int) $user_id === get_current_user_id() && self::current_user_has_available_section() ) {
			return array( 'read' );
		}

		return array( 'do_not_allow' );
	}

	/**
	 * Whether any dashboard section is available to the current user.
	 *
	 * @return bool
	 */
	private static function current_user_has_available_section() {
		// The registry hydrates only after init; the dashboard name comes with its loaded files.
		if ( self::$resolving_sections || ! did_action( 'init' ) || ! defined( __NAMESPACE__ . '\\DASHBOARD_NAME' ) ) {
			return false;
		}

		// add_menu_page() and the admin menu each check the capability on every admin screen.
		$key = get_current_user_id() . ':' . get_current_blog_id();
		if ( ! isset( self::$has_available_section[ $key ] ) ) {
			self::$resolving_sections = true;
			try {
				self::$has_available_section[ $key ] = array() !== Dashboard_Section_Registry::get_instance()->get_available_sections( DASHBOARD_NAME );
			} finally {
				self::$resolving_sections = false;
			}
		}

		return self::$has_available_section[ $key ];
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
	 * Capability the dashboard's menu and page need.
	 *
	 * @return string
	 */
	public static function dashboard_page_capability() {
		return self::is_site_connected() ? self::VIEW_ANALYTICS : self::pre_connection_capability();
	}

	/**
	 * Whether the current user can open the dashboard's Stats views, which links to them are gated on.
	 *
	 * @return bool
	 */
	public static function current_user_can_open_stats() {
		return self::current_user_can_view_stats()
			&& ( self::is_site_connected() || current_user_can( self::pre_connection_capability() ) );
	}

	/**
	 * Whether the site is connected to WordPress.com, as WordPress.com Simple always is.
	 *
	 * @return bool
	 */
	private static function is_site_connected() {
		return ( new Host() )->is_wpcom_simple() || ( new Connection_Manager() )->is_connected();
	}

	/**
	 * Until the site is connected the dashboard only offers to connect it, so like Stats it is for
	 * whoever can (`jetpack_connect`), or for administrators in offline mode, where nobody can.
	 *
	 * @return string
	 */
	private static function pre_connection_capability() {
		return ( new Status() )->is_offline_mode() ? 'manage_options' : 'jetpack_connect';
	}

	/**
	 * Whether the current user may read the Stats reports.
	 *
	 * "Stats reports" is everything the proxy serves under `view_stats`, mirroring what
	 * {@see \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller} enforces there (pinned by Capabilities_Test).
	 *
	 * @since 0.12.0
	 *
	 * @return bool
	 */
	public static function current_user_can_view_stats() {
		// `view_stats` alone would track Stats more closely, but it only works once Stats hooks its own
		// `map_meta_cap` — which Analytics::init_wpcom_simple() never does, locking out administrators too.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
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
		// The proxy accepts manage_options for every prefix.
		return current_user_can( 'manage_options' ) || current_user_can( 'view_woocommerce_reports' );
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
