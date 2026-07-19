<?php
/**
 * Public entry point for hosts that serve the dashboard support routes
 * without booting the rest of the package.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Registers the dashboard's REST support routes (widget modules, default
 * layout, sections) for a host that never calls Analytics::init().
 *
 * WordPress.com Simple serves the dashboard from WPCOM, not the site (see
 * Analytics::init_wpcom_simple()), so WPCOM's public-api process calls this
 * directly — see AGENTS.md for the call site and what to update on the WPCOM
 * side if this changes. Analytics::init() calls the same method for
 * connected sites, so there's one implementation, not two.
 */
class Dashboard_Support_Routes {

	/**
	 * Register the dashboard support routes.
	 *
	 * Idempotent: safe to call standalone, and safe to call more than once.
	 *
	 * @return void
	 */
	public static function register() {
		// Manifest register_widget_types() reads; absent without a JS build.
		$widgets_manifest = __DIR__ . '/../build/widgets.php';
		if ( file_exists( $widgets_manifest ) ) {
			require_once $widgets_manifest;
		}

		require_once __DIR__ . '/widget-types.php';
		require_once __DIR__ . '/widget-availability.php';
		bootstrap_widget_types();

		require_once __DIR__ . '/widget-modules.php';
		require_once __DIR__ . '/dashboard-layout.php';
		require_once __DIR__ . '/dashboard-sections.php';

		add_action( 'rest_api_init', __NAMESPACE__ . '\\register_widget_modules_rest_route' );
		add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_default_layout_route' );
		add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_sections_rest_routes' );
	}
}
