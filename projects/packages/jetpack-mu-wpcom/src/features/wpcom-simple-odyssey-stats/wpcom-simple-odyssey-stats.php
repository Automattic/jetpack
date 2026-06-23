<?php
/**
 * Load the Odyssey stats feature on WordPress.com Simple Site.
 * See https://github.com/Automattic/jetpack/tree/trunk/projects/packages/stats-admin
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Stats_Admin\Dashboard as OdysseyStats;
OdysseyStats::init();

// Only register when the loader path is available at include time, matching the
// original gate so the widget is not loaded on installs where it was not before.
if ( defined( 'JETPACK_PLUGIN_LOADER_PATH' ) ) {
	add_action( 'wp_dashboard_setup', 'wpcom_simple_odyssey_stats_load_dashboard_widget' );
}

if ( ! function_exists( 'wpcom_simple_odyssey_stats_load_dashboard_widget' ) ) {
	/**
	 * Load the Odyssey stats widget when the WordPress dashboard is assembled.
	 *
	 * Loaded lazily so the widget class is not required on requests that never build
	 * the dashboard, and named so the callback can be unregistered. `init()` is a
	 * static, idempotent entry point, so no instance is needed.
	 *
	 * @return void
	 */
	function wpcom_simple_odyssey_stats_load_dashboard_widget() {
		if ( ! defined( 'JETPACK_PLUGIN_LOADER_PATH' ) ) {
			return;
		}
		require_once JETPACK_PLUGIN_LOADER_PATH . '/class-jetpack-stats-dashboard-widget.php';
		Jetpack_Stats_Dashboard_Widget::init();
	}
}
