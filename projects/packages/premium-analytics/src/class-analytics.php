<?php
/**
 * Analytics package main class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use Automattic\Jetpack\PremiumAnalytics\REST\Notices_Controller;
use Automattic\Jetpack\PremiumAnalytics\Sync\Configuration as Sync_Configuration;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;

/**
 * Main Analytics class.
 *
 * Loads the wp-build output and registers an admin page.
 * The build interceptor handles full-page rendering via admin_init.
 */
class Analytics {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Menu title for the admin page.
	 *
	 * @var string
	 */
	private static $menu_title = 'Analytics';

	/**
	 * Initialize the Analytics app.
	 *
	 * @param array $options Optional configuration options.
	 *                       Supported keys:
	 *                       - menu_title (string): Admin menu label.
	 * @return void
	 */
	public static function init( $options = array() ) {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		if ( ! empty( $options['menu_title'] ) ) {
			self::$menu_title = $options['menu_title'];
		}

		// Load wp-build output (interceptor, modules, routes, page render).
		$build_entry = __DIR__ . '/../build/build.php';
		if ( file_exists( $build_entry ) ) {
			require_once $build_entry;
		}

		Sync_Status_Tracker::configure();
		// TEMPORARY (WOOA7S-1550): register the interim woocommerce_analytics sync module so
		// Sync_Status_Tracker has a full sync to observe. Remove when the shared sync-modules package lands.
		Sync_Configuration::register();
		Api_Proxy_Controller::register();
		Notices_Controller::register();

		add_action( 'admin_menu', array( static::class, 'register_admin_menu' ) );
		add_action( 'jetpack-premium-analytics_init', array( static::class, 'register_sidebar_items' ) );
		add_action( 'jetpack-premium-analytics_init', array( static::class, 'ensure_script_data' ) );
	}

	/**
	 * Register the admin menu page.
	 *
	 * The callback is __return_null because the wp-build interceptor
	 * renders the full-page app on admin_init and calls exit() before
	 * WordPress can invoke this callback.
	 *
	 * @return void
	 */
	public static function register_admin_menu() {
		add_menu_page(
			esc_html( self::$menu_title ),
			esc_html( self::$menu_title ),
			'manage_options',
			'jetpack-premium-analytics',
			'__return_null',
			'dashicons-chart-bar',
			30
		);
	}

	/**
	 * Register sidebar menu items for the full-page app.
	 *
	 * @return void
	 */
	public static function register_sidebar_items() {
		if ( ! function_exists( 'jpa_register_jetpack_premium_analytics_menu_item' ) ) {
			return;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
		jpa_register_jetpack_premium_analytics_menu_item(
			'dashboard',
			__( 'Dashboard', 'jetpack-premium-analytics' ),
			'/'
		);
	}

	/**
	 * Emit window.JetpackScriptData on the boot-rendered admin page.
	 *
	 * The wp-build interceptor that renders this page (its page.php template)
	 * reproduces wp-admin/admin-header.php but does not fire the
	 * `admin_print_scripts` action. The jetpack-assets Script_Data class hooks
	 * that action to print `window.JetpackScriptData` — which carries the
	 * connection data the route guards read — so without help the global is
	 * never emitted and the guards cannot tell whether the site is connected.
	 *
	 * Hooked on the page's own init action, this runs only for this page, in
	 * time for the footer scripts to print. Script_Data guards against rendering
	 * twice, so it is a no-op wherever `admin_print_scripts` fires normally.
	 *
	 * @return void
	 */
	public static function ensure_script_data() {
		$script_data = 'Automattic\Jetpack\Assets\Script_Data';
		if ( is_callable( array( $script_data, 'render_script_data' ) ) ) {
			$script_data::render_script_data();
		}
	}
}
