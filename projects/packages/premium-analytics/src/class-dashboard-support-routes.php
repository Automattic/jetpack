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
		add_action( 'rest_api_init', array( __CLASS__, 'boot_routes' ) );
	}

	/**
	 * Load the route files and register their REST routes.
	 *
	 * Deferred here (rest_api_init), not run from register() itself: register()
	 * runs on every request that boots this package, and on WPCOM Simple that's
	 * every request across all of WPCOM's public-api process, most of which
	 * never dispatch a Premium Analytics route. dashboard-sections.php hydrates
	 * its own section registry at file scope, which should not run before
	 * WordPress has decided this request is actually dispatching a REST route.
	 * widget-modules.php hydrates the widget type registry itself, lazily,
	 * only when its REST callback or the boot-deps filter actually runs.
	 *
	 * @return void
	 */
	public static function boot_routes() {
		// Load-bearing, not defensive duplication: since WOOA7S-1804 these files load
		// only in wp-admin, so on REST this method is their only loader.
		//
		// Guarded on a symbol from each file: two copies of this package can be loaded
		// in one request, and these file-scope functions are outside the autoloader's
		// dedupe. See Analytics::load_dashboard_components() for the full rationale.
		if ( ! function_exists( __NAMESPACE__ . '\\register_widget_modules_rest_route' ) ) {
			require_once __DIR__ . '/widget-modules.php';
		}
		if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_default_layout_route' ) ) {
			require_once __DIR__ . '/dashboard-layout.php';
		}
		if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_section' ) ) {
			require_once __DIR__ . '/dashboard-sections.php';
		}

		// These routes are gated on the dashboard capability, and WPCOM Simple boots
		// this class standalone, without going through Analytics::init().
		Capabilities::register();

		register_widget_modules_rest_route();
		register_dashboard_default_layout_route();
		register_dashboard_sections_rest_routes();
	}
}
