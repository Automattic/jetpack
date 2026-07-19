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
 * layout, sections) on a host that never calls Analytics::init().
 *
 * WordPress.com Simple serves the Premium Analytics dashboard from WPCOM
 * rather than from the site itself (see Analytics::init_wpcom_simple()), so
 * these routes need to exist in WPCOM's own public-api process instead. This
 * class is the single entry point for that: it owns the file list, load
 * order, and function names the routes depend on, so a future refactor of
 * those internals doesn't require a coordinated change on the WPCOM side.
 * `Analytics::init()` calls the same method for connected Jetpack sites, so
 * there is one implementation of "how to register these routes", not two.
 */
class Dashboard_Support_Routes {

	/**
	 * Register the dashboard support routes.
	 *
	 * Safe to call from a process that has otherwise loaded none of this
	 * package, and safe to call more than once: every step here is already
	 * idempotent on its own (require_once, the widget registry's own
	 * is_registered() check, and WordPress's de-duplication of an identical
	 * add_action() callback), so no extra guard is needed here.
	 *
	 * @return void
	 */
	public static function register_for_wpcom() {
		// Defines jpa_get_registered_widget_modules(), the manifest
		// register_widget_types() below reads. Guarded: absent in
		// environments without a JS build (e.g. some PHPUnit runs);
		// register_widget_types() itself guards its use of the manifest.
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
