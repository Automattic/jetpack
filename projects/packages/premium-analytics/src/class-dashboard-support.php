<?php
/**
 * Public entry point for hosts that render a widget dashboard without booting Stats v2.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Loads what a page needs to host a widget dashboard: the dashboard API and the shared
 * script modules a widget bundle imports.
 *
 * It injects no section script data, and for now the page hooks add_widget_modules_to_boot_deps()
 * to its own boot dependencies filter. The REST half is Dashboard_Support_Routes::register().
 *
 * @since 0.19.0
 */
class Dashboard_Support {

	/**
	 * Path to the generated script module registration. Null uses the generated build.
	 *
	 * A test seam, as Analytics::$build_entry is: `build/` is gitignored and test-php runs no build step.
	 *
	 * @var string|null
	 */
	private static $modules_entry = null;

	/**
	 * Load the dashboard API and register the shared script modules and the SDK alias.
	 *
	 * Idempotent. Call it before `wp_default_scripts` fires, on the requests that render the
	 * host's page: that hook is where the modules register.
	 *
	 * @since 0.19.0
	 *
	 * @return void
	 */
	public static function load() {
		// Widget modules for the client's dynamic import() map.
		require_once __DIR__ . '/widget-modules.php';

		// Default layout primitives and the bundled defaults' seed.
		require_once __DIR__ . '/dashboard-layout.php';

		// Dashboard section API.
		require_once __DIR__ . '/dashboard-sections.php';

		$modules_entry = self::$modules_entry ?? __DIR__ . '/../build/modules.php';
		if ( file_exists( $modules_entry ) ) {
			require_once $modules_entry;
			require_once __DIR__ . '/sdk-module.php';
		}
	}
}
