<?php
/**
 * Analytics package main class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

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
	 * Initialize the Analytics app.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		// Load wp-build output (interceptor, modules, routes, page render).
		$build_entry = __DIR__ . '/../build/build.php';
		if ( file_exists( $build_entry ) ) {
			require_once $build_entry;
		}

		add_action( 'admin_menu', array( static::class, 'register_admin_menu' ) );
		add_action( 'jetpack-premium-analytics_init', array( static::class, 'register_sidebar_items' ) );
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
			__( 'Analytics', 'jetpack-premium-analytics' ),
			__( 'Analytics', 'jetpack-premium-analytics' ),
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
}
